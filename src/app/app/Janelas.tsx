"use client";

import {
  BookOpen,
  CalendarDays,
  Check,
  CircleAlert,
  Coffee,
  Flame,
  Minus,
  Pencil,
  Play,
  Plus,
  Square,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { SeletorData } from "@/components/SeletorData";
import { dataCurta, diaMes, diaSemanaCurto, formatarMinutos } from "@/lib/datas";
import {
  FOCO_MAX,
  FOCO_MIN,
  formatarRelogio,
  guardarTempos,
  lerTempos,
  PAUSA_MAX,
  PAUSA_MIN,
  useAgora,
} from "@/lib/pomodoro";
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
    case "revisao":
      return <JanelaRevisao revisaoId={janela.revisao.id} conteudo={janela.conteudo} aoFechar={fechar} />;
    case "pomodoroFim":
      return <JanelaPomodoroFim revisaoId={janela.revisao.id} conteudo={janela.conteudo} aoFechar={fechar} />;
  }
}

/** Fica de olho no relógio e avisa quando o tempo da fase acaba. */
export function MonitorPomodoro() {
  const { pomodoro, pararPomodoro, todasRevisoes } = useApp();
  const existe = pomodoro ? todasRevisoes.some((r) => r.id === pomodoro.revisaoId) : true;

  useEffect(() => {
    if (!existe) pararPomodoro(); // o conteúdo foi excluído
  }, [existe, pararPomodoro]);

  return pomodoro && !pomodoro.terminou && existe ? <VigiaDoTempo fimEm={pomodoro.fimEm} /> : null;
}

function VigiaDoTempo({ fimEm }: { fimEm: number }) {
  const { fimDaFasePomodoro } = useApp();
  const acabou = useAgora() >= fimEm;
  useEffect(() => {
    if (acabou) fimDaFasePomodoro();
  }, [acabou, fimDaFasePomodoro]);
  return null;
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
  const dataRef = useRef<HTMLButtonElement>(null);

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
          <SeletorData id="data" ref={dataRef} valor={data} max={hoje} hoje={hoje} aoMudar={setData} />
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

function Passo({
  id,
  rotulo,
  valor,
  min,
  max,
  aoMudar,
}: {
  id: string;
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  aoMudar: (v: number) => void;
}) {
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <div className={styles.contador}>
        <button
          type="button"
          className="botao botao-secundario"
          onClick={() => aoMudar(Math.max(min, valor - (valor % 5 === 0 ? 5 : valor % 5)))}
          aria-label={`Diminuir ${rotulo.toLowerCase()}`}
          disabled={valor <= min}
        >
          <Minus size={16} />
        </button>
        <output id={id} className="entrada">
          {valor} min
        </output>
        <button
          type="button"
          className="botao botao-secundario"
          onClick={() => aoMudar(Math.min(max, valor + 5 - (valor % 5)))}
          aria-label={`Aumentar ${rotulo.toLowerCase()}`}
          disabled={valor >= max}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

/** Janela da revisão: anotações, pomodoro e botão de concluir. */
function JanelaRevisao({ revisaoId, conteudo, aoFechar }: { revisaoId: string; conteudo: Conteudo; aoFechar: () => void }) {
  const { disciplinaDe, abrir, todasRevisoes, alternarRevisao, pomodoro, iniciarPomodoro, pararPomodoro } = useApp();
  const agora = useAgora();
  // A janela só abre depois de um clique, então já dá para ler os tempos guardados no navegador
  const [tempos, setTempos] = useState(lerTempos);

  const r = todasRevisoes.find((x) => x.id === revisaoId);
  if (!r) return null;
  const feita = Boolean(r.feita_em);
  const meu = pomodoro?.revisaoId === r.id ? pomodoro : null;
  const outro = pomodoro && !meu;

  function mudar(t: typeof tempos) {
    setTempos(t);
    guardarTempos(t);
  }

  const restante = meu ? Math.max(0, meu.fimEm - agora) : 0;
  const total = meu ? (meu.fase === "foco" ? meu.focoMin : meu.pausaMin) * 60_000 : 1;
  const progresso = meu ? Math.min(100, Math.max(0, (1 - restante / total) * 100)) : 0;

  return (
    <Janela aoFechar={aoFechar} largura={520} rotulo="Revisão">
      <div className={styles.janelaTopo}>
        <span className={styles.janelaIcone}>
          <BookOpen size={20} />
        </span>
        <div>
          <h2 className="titulo2">{conteudo.assunto}</h2>
          <p className="legenda secundario">
            {disciplinaDe(conteudo)} · {nomeRevisao(r.numero)} · estudado em {dataCurta(conteudo.data_estudo)}
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

      <div className={styles.pomodoro}>
        <div className={styles.pomodoroTitulo}>
          <span className="corpo-forte">
            <Timer size={16} /> Pomodoro
          </span>
          {meu && (
            <span className={`legenda ${meu.fase === "foco" ? styles.textoAviso : styles.textoFeita}`}>
              {meu.fase === "foco" ? "Foco" : "Pausa"}
            </span>
          )}
        </div>

        {meu ? (
          <>
            <p className={styles.relogio} role="timer" aria-live="off">
              {meu.terminou ? "00:00" : formatarRelogio(restante)}
            </p>
            <span className={styles.barra}>
              <span style={{ width: `${meu.terminou ? 100 : progresso}%` }} />
            </span>
            <div className={styles.janelaBotoes}>
              {meu.terminou ? (
                <button type="button" className="botao botao-primario" onClick={() => abrir({ tipo: "pomodoroFim", revisao: r, conteudo })}>
                  Responder
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="botao botao-secundario" onClick={pararPomodoro}>
                <Square size={16} /> Parar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.configDois}>
              <Passo id="foco" rotulo="Foco" valor={tempos.foco} min={FOCO_MIN} max={FOCO_MAX} aoMudar={(v) => mudar({ ...tempos, foco: v })} />
              <Passo id="pausa" rotulo="Pausa" valor={tempos.pausa} min={PAUSA_MIN} max={PAUSA_MAX} aoMudar={(v) => mudar({ ...tempos, pausa: v })} />
            </div>
            {outro && <p className="legenda secundario">Você já tem um pomodoro rodando em outra revisão. Ao iniciar, ele será trocado por este.</p>}
            <button
              type="button"
              className="botao botao-primario"
              onClick={() => iniciarPomodoro(r, tempos.foco, tempos.pausa)}
              disabled={feita}
            >
              <Play size={16} /> Iniciar pomodoro de {tempos.foco} min
            </button>
          </>
        )}
      </div>

      <div className={styles.janelaBotoes}>
        <button type="button" className="botao botao-secundario" onClick={() => abrir({ tipo: "conteudo", conteudo })}>
          <Pencil size={16} /> Editar
        </button>
        {r.numero === 1 ? (
          <button type="button" className="botao botao-primario" onClick={aoFechar}>
            Fechar
          </button>
        ) : (
          <button
            type="button"
            className={feita ? "botao botao-secundario" : "botao botao-primario"}
            onClick={() => {
              if (!feita && meu) pararPomodoro();
              alternarRevisao(r);
              if (!feita) aoFechar();
            }}
          >
            <Check size={16} /> {feita ? "Concluída · desmarcar" : "Marcar como concluída"}
          </button>
        )}
      </div>
    </Janela>
  );
}

/** Pergunta o que fazer quando o tempo do pomodoro acaba. */
function JanelaPomodoroFim({ revisaoId, conteudo, aoFechar }: { revisaoId: string; conteudo: Conteudo; aoFechar: () => void }) {
  const { disciplinaDe, todasRevisoes, alternarRevisao, pomodoro, pararPomodoro, proximaFasePomodoro } = useApp();
  const r = todasRevisoes.find((x) => x.id === revisaoId);
  if (!r || !pomodoro || pomodoro.revisaoId !== r.id) return null;
  const foco = pomodoro.fase === "foco";

  return (
    <Janela aoFechar={aoFechar} largura={460} rotulo={foco ? "Tempo de foco acabou" : "Pausa acabou"}>
      <div className={styles.centro}>
        <span className={`${styles.janelaIcone} ${foco ? styles.iconeAviso : styles.iconeFeita}`}>
          {foco ? <Timer size={22} /> : <Coffee size={22} />}
        </span>
        <h2 className="titulo2">{foco ? "Tempo de foco acabou!" : "A pausa acabou!"}</h2>
        <span className={styles.etiqueta}>
          {disciplinaDe(conteudo)} · {conteudo.assunto}
        </span>
        <p className="corpo secundario">
          {foco ? `Você concluiu a ${nomeRevisao(r.numero)} deste conteúdo?` : "Pronto para outro bloco de foco?"}
        </p>
      </div>
      <div className={styles.janelaBotoesColuna}>
        {foco ? (
          <>
            <button
              type="button"
              className="botao botao-primario"
              onClick={() => {
                pararPomodoro();
                if (!r.feita_em) alternarRevisao(r);
                aoFechar();
              }}
            >
              <Check size={18} /> Sim, concluí
            </button>
            {pomodoro.pausaMin > 0 ? (
              <button type="button" className="botao botao-secundario" onClick={proximaFasePomodoro}>
                <Coffee size={18} /> Ainda não, pausa de {pomodoro.pausaMin} min
              </button>
            ) : (
              <button type="button" className="botao botao-secundario" onClick={proximaFasePomodoro}>
                <Play size={18} /> Ainda não, mais {pomodoro.focoMin} min de foco
              </button>
            )}
          </>
        ) : (
          <button type="button" className="botao botao-primario" onClick={proximaFasePomodoro}>
            <Play size={18} /> Começar outro foco de {pomodoro.focoMin} min
          </button>
        )}
        <button
          type="button"
          className="botao botao-secundario"
          onClick={() => {
            pararPomodoro();
            aoFechar();
          }}
        >
          Encerrar pomodoro
        </button>
      </div>
    </Janela>
  );
}
