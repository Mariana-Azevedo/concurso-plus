"use client";

import {
  BookOpen,
  CalendarDays,
  Check,
  CircleAlert,
  Flame,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { dataCurta, diaMes, diaSemanaCurto, formatarMinutos } from "@/lib/datas";
import { cargaDoDia, datasRevisoes, type Conteudo } from "@/lib/revisoes";
import { adicionarDisciplina, excluirConteudo, responderDificil, salvarConteudo } from "./acoes";
import { useApp } from "./Contexto";
import { nomeRevisao } from "./ListaRevisoes";
import styles from "./app.module.css";

/** Janela sobre a página, com fundo escurecido. Fecha com Esc ou clicando fora. */
function Janela({
  children,
  aoFechar,
  largura = 480,
  rotulo,
}: {
  children: React.ReactNode;
  aoFechar: () => void;
  largura?: number;
  rotulo: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.janela}
      style={{ maxWidth: largura }}
      aria-label={rotulo}
      onCancel={(e) => {
        e.preventDefault();
        aoFechar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) aoFechar();
      }}
    >
      <div className={styles.janelaCorpo}>{children}</div>
    </dialog>
  );
}

export function Janelas() {
  const { janela, fechar } = useApp();
  if (!janela) return null;
  switch (janela.tipo) {
    case "conteudo":
      return <JanelaConteudo key={janela.conteudo?.id ?? "novo"} conteudo={janela.conteudo} aoFechar={fechar} />;
    case "excluir":
      return <JanelaExcluir conteudo={janela.conteudo} aoFechar={fechar} />;
    case "dificil":
      return <JanelaDificil revisaoId={janela.revisao.id} numero={janela.revisao.numero} conteudo={janela.conteudo} aoFechar={fechar} />;
    case "anotacoes":
      return <JanelaAnotacoes conteudo={janela.conteudo} numero={janela.revisao.numero} aoFechar={fechar} />;
  }
}

function JanelaConteudo({ conteudo, aoFechar }: { conteudo?: Conteudo; aoFechar: () => void }) {
  const { disciplinas, hoje, todasRevisoes, limite, config } = useApp();
  const editando = Boolean(conteudo);
  const [disciplina, setDisciplina] = useState(conteudo?.disciplina_id ?? "");
  const [assunto, setAssunto] = useState(conteudo?.assunto ?? "");
  const [data, setData] = useState(conteudo?.data_estudo ?? hoje);
  const [anotacoes, setAnotacoes] = useState(conteudo?.anotacoes ?? "");
  const [novaDisciplina, setNovaDisciplina] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarLimite, setMostrarLimite] = useState(false);
  const [salvando, iniciar] = useTransition();
  const dataRef = useRef<HTMLInputElement>(null);

  const datas = data && data <= hoje ? datasRevisoes(data) : [];
  // Carga de cada dia das novas revisões (a 1ª não conta; datas passadas caem em hoje)
  const dias = datas.slice(1).map((d, i) => {
    const efetivo = d < hoje ? hoje : d;
    const outras = datas.slice(1).filter((x) => (x < hoje ? hoje : x) === efetivo).length;
    const carga = cargaDoDia(todasRevisoes, efetivo, hoje) + (editando ? 0 : outras);
    return { numero: i + 2, data: d, efetivo, carga, cheio: !editando && carga > limite };
  });
  const algumCheio = dias.some((d) => d.cheio);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!disciplina) return setErro("Escolha a disciplina.");
    if (!assunto.trim()) return setErro("Escreva o assunto.");
    if (!data || data > hoje) return setErro("A data de estudo precisa ser hoje ou um dia anterior.");
    if (algumCheio) return setMostrarLimite(true);
    iniciar(async () => {
      const r = await salvarConteudo({ id: conteudo?.id, disciplina_id: disciplina, assunto, data_estudo: data, anotacoes });
      if (r.ok) aoFechar();
      else if (r.diaCheio) setMostrarLimite(true);
      else setErro(r.erro);
    });
  }

  function criarDisciplina() {
    if (novaDisciplina === null) return;
    iniciar(async () => {
      const r = await adicionarDisciplina(novaDisciplina);
      if (r.ok && r.id) {
        setDisciplina(r.id);
        setNovaDisciplina(null);
        setErro(null);
      } else if (!r.ok) setErro(r.erro);
    });
  }

  if (mostrarLimite) {
    return (
      <Janela aoFechar={aoFechar} rotulo="Limite do dia">
        <span className={`${styles.janelaIcone} ${styles.iconeAviso}`}>
          <CircleAlert size={22} />
        </span>
        <h2 className="titulo2">Este conteúdo passaria do limite</h2>
        <p className="corpo secundario">
          Você estuda {formatarMinutos(config.horas_estudo_dia * 60)} por dia e pode usar até metade (
          {formatarMinutos(limite * config.minutos_por_revisao)}) com revisões. Um dos dias das revisões deste conteúdo
          já está cheio:
        </p>
        <ul className={styles.diasLimite}>
          {dias.map((d) => (
            <li key={d.numero} className={d.cheio ? styles.diaCheio : undefined}>
              {d.cheio ? <CircleAlert size={16} /> : <Check size={16} />}
              <span className="corpo-forte">{diaSemanaCurto(d.efetivo)}</span>
              <span className="legenda">
                {nomeRevisao(d.numero)} · {formatarMinutos(Math.min(d.carga, 99) * config.minutos_por_revisao)} de{" "}
                {formatarMinutos(limite * config.minutos_por_revisao)}
              </span>
            </li>
          ))}
        </ul>
        <div className={styles.janelaBotoes}>
          <Link href="/app/configuracoes" className="botao botao-secundario" onClick={aoFechar}>
            Ajustar limite
          </Link>
          <button
            type="button"
            className="botao botao-primario"
            onClick={() => {
              setMostrarLimite(false);
              requestAnimationFrame(() => dataRef.current?.focus());
            }}
          >
            <CalendarDays size={18} /> Mudar data
          </button>
        </div>
      </Janela>
    );
  }

  return (
    <Janela aoFechar={aoFechar} largura={540} rotulo={editando ? "Editar conteúdo" : "Novo conteúdo"}>
      <form onSubmit={salvar} className={styles.formConteudo}>
        <div className={styles.janelaTopo}>
          <span className={styles.janelaIcone}>{editando ? <Pencil size={20} /> : <BookOpen size={20} />}</span>
          <div>
            <h2 className="titulo2">{editando ? "Editar conteúdo" : "Novo conteúdo"}</h2>
            <p className="legenda secundario">
              {editando ? "Mudar a data recalcula só as revisões que faltam" : "As revisões são calculadas na hora"}
            </p>
          </div>
          <button type="button" className="botao-icone" onClick={aoFechar} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="campo">
          <label htmlFor="disciplina">Disciplina</label>
          {novaDisciplina === null ? (
            <>
              <select
                id="disciplina"
                className="entrada"
                value={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
                required
              >
                <option value="" disabled>
                  Escolha a disciplina
                </option>
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
              <button type="button" className={styles.linkAcao} onClick={() => setNovaDisciplina("")}>
                <Plus size={14} /> Adicionar nova disciplina
              </button>
            </>
          ) : (
            <div className={styles.linhaNova}>
              <input
                id="disciplina"
                className="entrada"
                placeholder="Nome da nova disciplina"
                value={novaDisciplina}
                onChange={(e) => setNovaDisciplina(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    criarDisciplina();
                  }
                }}
                autoFocus
                maxLength={80}
              />
              <button type="button" className="botao botao-secundario" onClick={() => setNovaDisciplina(null)}>
                Cancelar
              </button>
              <button type="button" className="botao botao-primario" onClick={criarDisciplina} disabled={salvando || !novaDisciplina.trim()}>
                Adicionar
              </button>
            </div>
          )}
        </div>

        <div className="campo">
          <label htmlFor="assunto">Assunto</label>
          <input
            id="assunto"
            className="entrada"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Ex.: Controle de constitucionalidade"
            maxLength={200}
            required
            autoFocus={!editando}
          />
        </div>

        <div className="campo">
          <label htmlFor="data">
            Data de estudo {data === hoje && <span className="secundario">(hoje)</span>}
          </label>
          <input
            id="data"
            ref={dataRef}
            type="date"
            className="entrada"
            value={data}
            max={hoje}
            onChange={(e) => setData(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="anotacoes">
            Anotações <span className="secundario">(opcional)</span>
          </label>
          <textarea
            id="anotacoes"
            className="entrada"
            value={anotacoes}
            onChange={(e) => setAnotacoes(e.target.value)}
            placeholder="Ex.: pontos que mais caem, artigos para reler, links..."
            rows={3}
          />
        </div>

        {datas.length > 0 && (
          <div className={styles.programadas}>
            <div className={styles.programadasTopo}>
              <span className="corpo-forte">
                <CalendarDays size={16} /> Revisões programadas
              </span>
              {!editando && (
                <span className={`legenda ${algumCheio ? styles.textoAviso : styles.textoFeita}`}>
                  {algumCheio ? "Um dos dias está cheio" : "Carga ok em todos os dias"}
                </span>
              )}
            </div>
            <ol className={styles.programadasDatas}>
              {datas.map((d, i) => {
                const original = editando ? conteudo?.revisoes.find((r) => r.numero === i + 1) : undefined;
                const feitaAntes = Boolean(original?.feita_em);
                const cheio = i > 0 && dias[i - 1]?.cheio;
                return (
                  <li key={i} className={i === 0 || feitaAntes ? styles.dataFeita : cheio ? styles.dataCheia : undefined}>
                    <strong>
                      {(i === 0 || feitaAntes) && <Check size={13} strokeWidth={3} />} {i + 1}ª
                    </strong>
                    <span>{diaMes(feitaAntes && original ? original.data_prevista : d)}</span>
                  </li>
                );
              })}
            </ol>
            <p className="legenda secundario">
              {editando
                ? "As revisões já feitas continuam como estão."
                : `A 1ª revisão (logo após aprender) já entra como feita${data < hoje ? `, em ${dataCurta(data)}` : ""}.`}
            </p>
          </div>
        )}

        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}

        <div className={styles.janelaBotoes}>
          <button type="button" className="botao botao-secundario" onClick={aoFechar}>
            Cancelar
          </button>
          <button type="submit" className="botao botao-primario" disabled={salvando}>
            <Check size={18} /> {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Salvar conteúdo"}
          </button>
        </div>
      </form>
    </Janela>
  );
}

function JanelaExcluir({ conteudo, aoFechar }: { conteudo: Conteudo; aoFechar: () => void }) {
  const { mostrarAviso } = useApp();
  const [excluindo, iniciar] = useTransition();
  return (
    <Janela aoFechar={aoFechar} largura={440} rotulo="Excluir conteúdo">
      <span className={`${styles.janelaIcone} ${styles.iconePerigo}`}>
        <Trash2 size={22} />
      </span>
      <h2 className="titulo2">Excluir conteúdo?</h2>
      <p className="corpo secundario">
        “{conteudo.assunto}” e todas as suas revisões serão apagados. Isso não pode ser desfeito.
      </p>
      <div className={styles.janelaBotoes}>
        <button type="button" className="botao botao-secundario" onClick={aoFechar}>
          Cancelar
        </button>
        <button
          type="button"
          className="botao botao-perigo"
          disabled={excluindo}
          onClick={() =>
            iniciar(async () => {
              const r = await excluirConteudo(conteudo.id);
              if (!r.ok) mostrarAviso(r.erro);
              aoFechar();
            })
          }
        >
          <Trash2 size={18} /> {excluindo ? "Excluindo…" : "Excluir"}
        </button>
      </div>
    </Janela>
  );
}

function JanelaDificil({
  revisaoId,
  numero,
  conteudo,
  aoFechar,
}: {
  revisaoId: string;
  numero: number;
  conteudo: Conteudo;
  aoFechar: () => void;
}) {
  const { disciplinaDe, mostrarAviso } = useApp();
  const [salvando, iniciar] = useTransition();
  const responder = (dificil: boolean) =>
    iniciar(async () => {
      const r = await responderDificil(revisaoId, dificil);
      if (!r.ok) mostrarAviso(r.erro);
      aoFechar();
    });

  return (
    <Janela aoFechar={aoFechar} largura={460} rotulo="Ainda acha difícil?">
      <div className={styles.centro}>
        <span className={`${styles.janelaIcone} ${styles.iconeAviso}`}>
          <Flame size={22} />
        </span>
        <h2 className="titulo2">{numero > 5 ? "Revisão extra concluída!" : "5ª revisão concluída!"}</h2>
        <span className={styles.etiqueta}>
          {disciplinaDe(conteudo)} · {conteudo.assunto}
        </span>
        <p className="corpo secundario">
          Ainda acha este conteúdo difícil? Se sim, ele ganha uma revisão extra daqui a 15 dias.
        </p>
      </div>
      <div className={styles.janelaBotoesColuna}>
        <button type="button" className="botao botao-primario" disabled={salvando} onClick={() => responder(true)}>
          <Flame size={18} /> Sim, revisar de novo em 15 dias
        </button>
        <button type="button" className="botao botao-secundario" disabled={salvando} onClick={() => responder(false)}>
          <Check size={18} /> Não, marcar como concluído
        </button>
      </div>
    </Janela>
  );
}

function JanelaAnotacoes({ conteudo, numero, aoFechar }: { conteudo: Conteudo; numero: number; aoFechar: () => void }) {
  const { disciplinaDe, abrir } = useApp();
  return (
    <Janela aoFechar={aoFechar} largura={500} rotulo="Anotações">
      <div className={styles.janelaTopo}>
        <span className={styles.janelaIcone}>
          <BookOpen size={20} />
        </span>
        <div>
          <h2 className="titulo2">{conteudo.assunto}</h2>
          <p className="legenda secundario">
            {disciplinaDe(conteudo)} · {nomeRevisao(numero)} · estudado em {dataCurta(conteudo.data_estudo)}
          </p>
        </div>
        <button type="button" className="botao-icone" onClick={aoFechar} aria-label="Fechar">
          <X size={20} />
        </button>
      </div>
      {conteudo.anotacoes ? (
        <p className={styles.anotacoes}>{conteudo.anotacoes}</p>
      ) : (
        <p className="corpo secundario">Sem anotações para este conteúdo.</p>
      )}
      <div className={styles.janelaBotoes}>
        <button type="button" className="botao botao-secundario" onClick={() => abrir({ tipo: "conteudo", conteudo })}>
          <Pencil size={16} /> Editar
        </button>
        <button type="button" className="botao botao-primario" onClick={aoFechar}>
          Fechar
        </button>
      </div>
    </Janela>
  );
}
