"use client";

import {
  BookOpen,
  Check,
  Clock,
  Info,
  Lock,
  LogOut,
  Minus,
  Monitor,
  Moon,
  Palette,
  Plus,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { formatarMinutos } from "@/lib/datas";
import { limiteRevisoesDia, type Tema } from "@/lib/revisoes";
import { aplicarTema } from "@/lib/tema";
import { sair } from "../../(entrar)/acoes";
import { adicionarDisciplina, removerDisciplina, renomearDisciplina, salvarTema, salvarTempo } from "../acoes";
import { useApp } from "../Contexto";
import styles from "../app.module.css";

const TEMAS: { id: Tema; nome: string; icone: typeof Sun }[] = [
  { id: "claro", nome: "Claro", icone: Sun },
  { id: "escuro", nome: "Escuro", icone: Moon },
  { id: "automatico", nome: "Automático", icone: Monitor },
];

type Ajustes = { horas: number; minutos: number; tema: Tema };

export default function Configuracoes() {
  const { config, mostrarAviso } = useApp();
  // "salvo" é o que está na conta; "ajustes" é o que está na tela
  const [salvo, setSalvo] = useState<Ajustes>({
    horas: config.horas_estudo_dia,
    minutos: config.minutos_por_revisao,
    tema: config.tema,
  });
  const [ajustes, setAjustes] = useState<Ajustes>(salvo);
  const [salvando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const mudou = ajustes.horas !== salvo.horas || ajustes.minutos !== salvo.minutos || ajustes.tema !== salvo.tema;

  // Se sair sem salvar, o tema volta ao que está salvo
  const temaSalvo = useRef(salvo.tema);
  useEffect(() => {
    temaSalvo.current = salvo.tema;
  }, [salvo.tema]);
  useEffect(() => () => aplicarTema(temaSalvo.current), []);

  function salvar() {
    setErro(null);
    const novo = ajustes;
    iniciar(async () => {
      try {
        if (novo.horas !== salvo.horas || novo.minutos !== salvo.minutos) {
          const r = await salvarTempo(novo.horas, novo.minutos);
          if (!r.ok) return setErro(r.erro);
        }
        if (novo.tema !== salvo.tema) {
          const r = await salvarTema(novo.tema);
          if (!r.ok) return setErro(r.erro);
        }
        setSalvo(novo);
        mostrarAviso("Configurações salvas!");
      } catch {
        setErro("Não foi possível salvar. Confira a internet e tente de novo.");
      }
    });
  }

  return (
    <main className={styles.pagina}>
      <title>Configurações · Concurso Plus</title>
      <section className={styles.secao}>
        <div>
          <h1 className="titulo1">Configurações</h1>
          <p className="corpo secundario">Ajuste seu ritmo de estudo, disciplinas e aparência.</p>
        </div>
        <div className={styles.configGrade}>
          <div className={styles.configColuna}>
            <CartaoTempo
              horas={ajustes.horas}
              minutos={ajustes.minutos}
              aoMudar={(horas, minutos) => setAjustes((a) => ({ ...a, horas, minutos }))}
            />
            <CartaoTema tema={ajustes.tema} aoMudar={(tema) => setAjustes((a) => ({ ...a, tema }))} />
          </div>
          <div className={styles.configColuna}>
            <CartaoDisciplinas />
            <CartaoConta />
          </div>
        </div>
        <div className={`cartao ${styles.barraSalvar}`}>
          {erro ? (
            <span className="erro" role="alert">
              {erro}
            </span>
          ) : (
            <span className="legenda secundario">
              {mudou ? "Você tem alterações que ainda não foram salvas." : "Tempo de estudo e aparência estão salvos."}
            </span>
          )}
          <button type="button" className="botao botao-primario" onClick={salvar} disabled={!mudou || salvando}>
            <Check size={18} /> {salvando ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </section>
    </main>
  );
}

function Cabecalho({ icone: Icone, titulo, texto, cor }: { icone: typeof Sun; titulo: string; texto: string; cor?: string }) {
  return (
    <div className={styles.configTopo}>
      <span className={`${styles.janelaIcone} ${cor ?? ""}`}>
        <Icone size={20} />
      </span>
      <div>
        <h2 className="titulo3">{titulo}</h2>
        <p className="legenda secundario">{texto}</p>
      </div>
    </div>
  );
}

function Contador({
  id,
  rotulo,
  valor,
  texto,
  passo,
  min,
  max,
  aoMudar,
  padrao,
}: {
  id: string;
  rotulo: string;
  valor: number;
  texto: string;
  passo: number;
  min: number;
  max: number;
  aoMudar: (v: number) => void;
  padrao: string;
}) {
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <div className={styles.contador}>
        <button type="button" className="botao botao-secundario" onClick={() => aoMudar(Math.max(min, valor - passo))} aria-label={`Diminuir ${rotulo.toLowerCase()}`} disabled={valor <= min}>
          <Minus size={16} />
        </button>
        <output id={id} className="entrada">
          {texto}
        </output>
        <button type="button" className="botao botao-secundario" onClick={() => aoMudar(Math.min(max, valor + passo))} aria-label={`Aumentar ${rotulo.toLowerCase()}`} disabled={valor >= max}>
          <Plus size={16} />
        </button>
      </div>
      <p className="legenda secundario">{padrao}</p>
    </div>
  );
}

function CartaoTempo({
  horas,
  minutos,
  aoMudar,
}: {
  horas: number;
  minutos: number;
  aoMudar: (horas: number, minutos: number) => void;
}) {
  const limite = limiteRevisoesDia({ horas_estudo_dia: horas, minutos_por_revisao: minutos });
  const salvar = aoMudar;

  return (
    <div className={`cartao ${styles.configCartao}`}>
      <Cabecalho icone={Clock} titulo="Tempo de estudo" texto="Usado para calcular o limite de revisões por dia" />
      <div className={styles.configDois}>
        <Contador
          id="horas"
          rotulo="Horas de estudo por dia"
          valor={horas}
          texto={formatarMinutos(Math.round(horas * 60))}
          passo={0.5}
          min={0.5}
          max={16}
          aoMudar={(v) => salvar(v, minutos)}
          padrao="Padrão: 4 horas"
        />
        <Contador
          id="minutos"
          rotulo="Tempo de cada revisão"
          valor={minutos}
          texto={`${minutos} min`}
          passo={5}
          min={5}
          max={120}
          aoMudar={(v) => salvar(horas, v)}
          padrao="Padrão: 30 minutos"
        />
      </div>
      <div className={styles.configInfo}>
        <Info size={18} />
        <div>
          <p className="corpo-forte">
            Limite: até {limite} {limite === 1 ? "revisão" : "revisões"} por dia ({formatarMinutos(limite * minutos)})
          </p>
          <p className="legenda">
            As revisões podem usar no máximo metade do tempo de estudo. Se um dia estiver cheio, não dá para cadastrar
            conteúdo que caia nele.
          </p>
        </div>
      </div>
    </div>
  );
}

function CartaoTema({ tema, aoMudar }: { tema: Tema; aoMudar: (tema: Tema) => void }) {
  return (
    <div className={`cartao ${styles.configCartao}`}>
      <Cabecalho icone={Palette} titulo="Aparência" texto="Escolha o tema do site" cor={styles.iconeAviso} />
      <div className={styles.temas} role="radiogroup" aria-label="Tema">
        {TEMAS.map(({ id, nome, icone: Icone }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={tema === id}
            className={tema === id ? styles.temaAtivo : styles.tema}
            onClick={() => {
              aoMudar(id);
              aplicarTema(id); // mostra o tema na hora; só fica salvo ao clicar em Salvar
            }}
          >
            <Icone size={20} />
            {nome}
          </button>
        ))}
      </div>
    </div>
  );
}

function CartaoDisciplinas() {
  const { disciplinas, conteudos, mostrarAviso } = useApp();
  const [nova, setNova] = useState("");
  const [editando, setEditando] = useState<{ id: string; nome: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  const uso = new Map<string, number>();
  for (const c of conteudos) uso.set(c.disciplina_id, (uso.get(c.disciplina_id) ?? 0) + 1);

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    iniciar(async () => {
      const r = await adicionarDisciplina(nova);
      if (r.ok) setNova("");
      else setErro(r.erro);
    });
  }

  function renomear() {
    if (!editando) return;
    const atual = editando;
    iniciar(async () => {
      const r = await renomearDisciplina(atual.id, atual.nome);
      if (r.ok) setEditando(null);
      else setErro(r.erro);
    });
  }

  return (
    <div className={`cartao ${styles.configCartao}`}>
      <Cabecalho
        icone={BookOpen}
        titulo="Disciplinas"
        texto="Lista usada ao cadastrar conteúdos. Clique no nome para renomear."
      />
      <form onSubmit={adicionar} className={styles.linhaNova}>
        <label htmlFor="nova-disciplina" className="so-leitor">
          Nome da nova disciplina
        </label>
        <input
          id="nova-disciplina"
          className="entrada"
          placeholder="Nome da nova disciplina"
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          maxLength={80}
        />
        <button type="submit" className="botao botao-primario" disabled={ocupado || !nova.trim()}>
          <Plus size={18} /> Adicionar
        </button>
      </form>
      {erro && <p className="erro">{erro}</p>}
      <ul className={styles.chips}>
        {disciplinas.map((d) => {
          const n = uso.get(d.id) ?? 0;
          if (editando?.id === d.id) {
            return (
              <li key={d.id} className={styles.chipEditando}>
                <input
                  className="entrada"
                  value={editando.nome}
                  onChange={(e) => setEditando({ id: d.id, nome: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") renomear();
                    if (e.key === "Escape") setEditando(null);
                  }}
                  onBlur={renomear}
                  autoFocus
                  aria-label={`Novo nome para ${d.nome}`}
                  maxLength={80}
                />
              </li>
            );
          }
          return (
            <li key={d.id} className={styles.chip}>
              <button type="button" onClick={() => setEditando({ id: d.id, nome: d.nome })} title="Renomear">
                {d.nome}
              </button>
              {n > 0 && <span className={styles.chipNumero}>{n}</span>}
              <button
                type="button"
                className={styles.chipRemover}
                disabled={n > 0 || ocupado}
                aria-label={n > 0 ? `${d.nome} tem conteúdos e não pode ser removida` : `Remover ${d.nome}`}
                title={n > 0 ? "Tem conteúdos" : "Remover"}
                onClick={() =>
                  iniciar(async () => {
                    const r = await removerDisciplina(d.id);
                    if (!r.ok) mostrarAviso(r.erro);
                  })
                }
              >
                <X size={14} />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="legenda secundario">Disciplinas com conteúdos não podem ser removidas (o x fica apagado).</p>
    </div>
  );
}

function CartaoConta() {
  const { usuario } = useApp();
  return (
    <div className={`cartao ${styles.configCartao}`}>
      <Cabecalho
        icone={UserRound}
        titulo="Conta"
        texto={`${usuario.email} · entrou com ${usuario.comGoogle ? "o Google" : "e-mail e senha"}`}
        cor={styles.iconeFeita}
      />
      <Link href="/redefinir-senha" className={`botao botao-secundario ${styles.botaoLinha}`}>
        <Lock size={18} /> {usuario.comGoogle ? "Criar uma senha" : "Trocar senha"}
      </Link>
      <form action={sair}>
        <button type="submit" className={`botao botao-secundario ${styles.botaoLinha} ${styles.textoAtrasada}`}>
          <LogOut size={18} /> Sair da conta
        </button>
      </form>
    </div>
  );
}
