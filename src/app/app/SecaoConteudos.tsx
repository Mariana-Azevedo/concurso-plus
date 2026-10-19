"use client";

import { BookOpen, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { diaMes } from "@/lib/datas";
import { pontosRevisoes, proximaRevisao, statusConteudo, type Conteudo, type StatusConteudo } from "@/lib/revisoes";
import { useApp } from "./Contexto";
import styles from "./app.module.css";

const FILTROS: { id: "todos" | StatusConteudo; nome: string }[] = [
  { id: "todos", nome: "Todos" },
  { id: "em_revisao", nome: "Em revisão" },
  { id: "atrasado", nome: "Atrasados" },
  { id: "dificil", nome: "Difíceis" },
  { id: "concluido", nome: "Concluídos" },
];

const ROTULO: Partial<Record<StatusConteudo, { texto: string; classe: string }>> = {
  atrasado: { texto: "Atrasada", classe: styles.textoAtrasada },
  dificil: { texto: "Difícil", classe: styles.textoAviso },
  concluido: { texto: "Concluído", classe: styles.textoFeita },
};

function semAcento(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function SecaoConteudos() {
  const { conteudos, hoje, disciplinaDe, abrir } = useApp();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["id"]>("todos");
  const [busca, setBusca] = useState("");

  const comStatus = conteudos.map((c) => ({ c, status: statusConteudo(c, hoje) }));
  const contagem = (id: (typeof FILTROS)[number]["id"]) =>
    id === "todos" ? comStatus.length : comStatus.filter((x) => x.status === id).length;

  const termo = semAcento(busca.trim());
  const visiveis = comStatus.filter(
    (x) =>
      (filtro === "todos" || x.status === filtro) &&
      (!termo || semAcento(`${x.c.assunto} ${disciplinaDe(x.c)}`).includes(termo)),
  );

  function textoProxima(c: Conteudo, status: StatusConteudo): string {
    if (status === "concluido") {
      const ultima = c.revisoes.map((r) => r.feita_em).filter(Boolean).sort().pop();
      return ultima ? `Concluído em ${diaMes(ultima)}` : "Concluído";
    }
    const p = proximaRevisao(c);
    if (!p) return "Aguardando resposta";
    const quando = p.data_prevista <= hoje ? "hoje" : diaMes(p.data_prevista);
    return p.numero > 5 ? `Extra: ${quando}` : `Próxima: ${quando}`;
  }

  return (
    <section id="conteudos" className={styles.secao} aria-labelledby="titulo-conteudos">
      <div className={`${styles.cabecalho} ${styles.cabecalhoConteudos}`}>
        <div>
          <h2 id="titulo-conteudos" className="titulo1">
            Conteúdos
          </h2>
          <p className="corpo secundario">
            {conteudos.length} {conteudos.length === 1 ? "cadastrado" : "cadastrados"}
          </p>
        </div>
        <div className={styles.cabecalhoAcoes}>
          <label className={styles.busca}>
            <Search size={18} />
            <span className="so-leitor">Buscar conteúdo</span>
            <input type="search" placeholder="Buscar" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          <button type="button" className={`botao botao-primario ${styles.soComputadorFlex}`} onClick={() => abrir({ tipo: "conteudo" })}>
            <Plus size={18} /> Novo conteúdo
          </button>
        </div>
      </div>

      <div className={styles.filtros} role="tablist" aria-label="Filtrar conteúdos">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filtro === f.id}
            className={filtro === f.id ? styles.filtroAtivo : styles.filtro}
            onClick={() => setFiltro(f.id)}
          >
            {f.nome} <span>{contagem(f.id)}</span>
          </button>
        ))}
      </div>

      {visiveis.length ? (
        <ul className={`cartao ${styles.lista}`}>
          {visiveis.map(({ c, status }) => (
            <li key={c.id} className={`${styles.linhaConteudo} ${ROTULO[status] ? styles.temStatus : ""}`}>
              <div className={styles.linhaNome}>
                <span className={styles.assunto}>{c.assunto}</span>
                <span className="legenda secundario">{disciplinaDe(c)}</span>
              </div>
              <span className={styles.pontos} aria-label="Andamento das revisões">
                {pontosRevisoes(c, hoje).map((p, i) => (
                  <span key={i} className={styles[`ponto_${p}`]} />
                ))}
              </span>
              <span className={`legenda secundario ${styles.linhaProxima}`}>{textoProxima(c, status)}</span>
              <span className={`legenda ${styles.linhaStatus} ${ROTULO[status]?.classe ?? ""}`}>
                {ROTULO[status]?.texto}
              </span>
              <MenuConteudo conteudo={c} />
            </li>
          ))}
        </ul>
      ) : (
        <div className={`cartao ${styles.vazio}`}>
          <BookOpen size={28} />
          {conteudos.length ? (
            <p className="corpo secundario">Nenhum conteúdo encontrado.</p>
          ) : (
            <>
              <p className="titulo3">Nenhum conteúdo ainda</p>
              <p className="corpo secundario">Cadastre o que você estudou hoje e as revisões serão agendadas.</p>
              <button type="button" className="botao botao-primario" onClick={() => abrir({ tipo: "conteudo" })}>
                <Plus size={18} /> Novo conteúdo
              </button>
            </>
          )}
        </div>
      )}

      <div className={styles.legendaPontos}>
        <span>
          <span className={styles.ponto_feita} /> Revisão feita
        </span>
        <span>
          <span className={styles.ponto_atrasada} /> Atrasada
        </span>
        <span>
          <span className={styles.ponto_afazer} /> A fazer
        </span>
      </div>
    </section>
  );
}

function MenuConteudo({ conteudo }: { conteudo: Conteudo }) {
  const { abrir } = useApp();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("click", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  return (
    <div className={styles.maisCaixa} ref={ref}>
      <button
        type="button"
        className={`botao-icone ${styles.mais}`}
        onClick={() => setAberto((v) => !v)}
        aria-label={`Opções de ${conteudo.assunto}`}
        aria-expanded={aberto}
      >
        <MoreHorizontal size={18} />
      </button>
      {aberto && (
        <div className={`cartao ${styles.menuConta} ${styles.menuMais}`}>
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              setAberto(false);
              abrir({ tipo: "conteudo", conteudo });
            }}
          >
            <Pencil size={16} /> Editar
          </button>
          <button
            type="button"
            className={`${styles.menuItem} ${styles.menuSair}`}
            onClick={() => {
              setAberto(false);
              abrir({ tipo: "excluir", conteudo });
            }}
          >
            <Trash2 size={16} /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}
