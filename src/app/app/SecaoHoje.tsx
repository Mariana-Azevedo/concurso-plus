"use client";

import { PartyPopper, Plus } from "lucide-react";
import { dataLonga, formatarMinutos } from "@/lib/datas";
import { cargaDoDia, estaAtrasada, ordenarLista, revisoesDaSemana, revisoesDoDia } from "@/lib/revisoes";
import { useApp } from "./Contexto";
import { ListaRevisoes } from "./ListaRevisoes";
import styles from "./app.module.css";

export function SecaoHoje({ saudacao }: { saudacao: string }) {
  const { hoje, usuario, todasRevisoes, config, limite, conteudoDe, abrir } = useApp();

  const lista = ordenarLista(revisoesDoDia(todasRevisoes, hoje, hoje), hoje, (r) => conteudoDe(r).assunto);
  const feitas = lista.filter((r) => r.feita_em).length;
  const pendentes = lista.length - feitas;
  const atrasadas = lista.filter((r) => estaAtrasada(r, hoje)).length;
  const carga = cargaDoDia(todasRevisoes, hoje, hoje);
  const minutosUsados = carga * config.minutos_por_revisao;
  const minutosLimite = limite * config.minutos_por_revisao;
  const semana = revisoesDaSemana(todasRevisoes, hoje);
  const totalSemana = semana.reduce((s, d) => s + d.total, 0);
  const maiorDia = Math.max(1, ...semana.map((d) => d.total));
  const primeiroNome = usuario.nome.split(" ")[0];

  return (
    <section id="hoje" className={styles.secao} aria-labelledby="titulo-hoje">
      <div className={styles.cabecalho}>
        <div>
          <p className="corpo secundario">{dataLonga(hoje)}</p>
          <h1 id="titulo-hoje" className="titulo1">
            {saudacao}, {primeiroNome}
          </h1>
        </div>
        <button
          type="button"
          className={`botao botao-primario ${styles.novo}`}
          onClick={() => abrir({ tipo: "conteudo" })}
          aria-label="Novo conteúdo"
        >
          <Plus size={18} /> <span>Novo conteúdo</span>
        </button>
      </div>

      <div className={`cartao ${styles.resumo}`}>
        <div className={styles.metrica}>
          <p className="legenda secundario">
            <span className={styles.soComputador}>Revisões de hoje</span>
            <span className={styles.soCelular}>Hoje</span>
          </p>
          <p className="titulo1">
            {feitas} de {lista.length}
          </p>
          <span className={styles.barra}>
            <span style={{ width: `${lista.length ? (feitas / lista.length) * 100 : 0}%` }} />
          </span>
        </div>
        <div className={styles.metrica}>
          <p className="legenda secundario">Atrasadas</p>
          <p className={`titulo1 ${atrasadas ? styles.textoAtrasada : ""}`}>{atrasadas}</p>
          <p className="legenda secundario">{atrasadas ? "Aparece no topo da lista" : "Tudo em dia"}</p>
        </div>
        <div className={styles.metrica}>
          <p className="legenda secundario">
            <span className={styles.soComputador}>Tempo de revisão</span>
            <span className={styles.soCelular}>Tempo</span>
          </p>
          <p className="titulo1">
            {formatarMinutos(minutosUsados)} de {formatarMinutos(minutosLimite)}
          </p>
          <span className={`${styles.barra} ${carga >= limite ? styles.barraCheia : ""}`}>
            <span style={{ width: `${Math.min(100, limite ? (carga / limite) * 100 : 0)}%` }} />
          </span>
        </div>
        <div className={`${styles.metrica} ${styles.soComputador}`}>
          <p className="legenda secundario">Esta semana</p>
          <p className="titulo1">
            {totalSemana} {totalSemana === 1 ? "revisão" : "revisões"}
          </p>
          <span className={styles.semana} aria-hidden="true">
            {semana.map((d) => (
              <span
                key={d.dia}
                className={d.dia === hoje ? styles.semanaHoje : undefined}
                style={{ height: Math.max(3, Math.round((d.total / maiorDia) * 20)) }}
              />
            ))}
          </span>
        </div>
      </div>

      <div className={styles.subtitulo}>
        <h2 className="titulo2">Para revisar hoje</h2>
        <span className="corpo secundario">
          {pendentes} {pendentes === 1 ? "pendente" : "pendentes"}
        </span>
      </div>

      {lista.length ? (
        <ListaRevisoes revisoes={lista} />
      ) : (
        <div className={`cartao ${styles.vazio}`}>
          <PartyPopper size={28} />
          <p className="titulo3">Nada para revisar hoje</p>
          <p className="corpo secundario">Aproveite o tempo para estudar um conteúdo novo e cadastrá-lo aqui.</p>
        </div>
      )}
    </section>
  );
}
