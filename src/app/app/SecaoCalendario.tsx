"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { dataLonga, diaMes, diasDoMes, formatarMinutos, mesAno } from "@/lib/datas";
import { cargaDoDia, estaAtrasada, ordenarLista, revisoesDoDia } from "@/lib/revisoes";
import { useApp } from "./Contexto";
import { ListaRevisoes } from "./ListaRevisoes";
import styles from "./app.module.css";

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const SEMANA_CURTA = ["D", "S", "T", "Q", "Q", "S", "S"];

export function SecaoCalendario() {
  const { hoje, todasRevisoes, config, conteudoDe } = useApp();
  const [ano, setAno] = useState(Number(hoje.slice(0, 4)));
  const [mes, setMes] = useState(Number(hoje.slice(5, 7)) - 1);
  const [selecionado, setSelecionado] = useState(hoje);

  function mudarMes(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
  }

  const dias = diasDoMes(ano, mes);
  const listaDia = ordenarLista(revisoesDoDia(todasRevisoes, selecionado, hoje), hoje, (r) => conteudoDe(r).assunto);
  const carga = cargaDoDia(todasRevisoes, selecionado, hoje);
  const atrasadasHoje =
    selecionado === hoje ? listaDia.filter((r) => estaAtrasada(r, hoje)).map((r) => diaMes(r.data_prevista)) : [];

  return (
    <section id="calendario" className={styles.secao} aria-labelledby="titulo-calendario">
      <div>
        <h2 id="titulo-calendario" className="titulo1">
          Calendário
        </h2>
        <p className="corpo secundario">Revisões de cada dia do mês</p>
      </div>

      <div className={styles.calendarioGrade}>
        <div className={`cartao ${styles.calendario}`}>
          <div className={styles.calendarioTopo}>
            <h3 className="titulo2" aria-live="polite">
              {mesAno(ano, mes)}
            </h3>
            <div>
              <button type="button" className="botao-icone" onClick={() => mudarMes(-1)} aria-label="Mês anterior">
                <ChevronLeft size={20} />
              </button>
              <button type="button" className="botao-icone" onClick={() => mudarMes(1)} aria-label="Próximo mês">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className={styles.semanaNomes} aria-hidden="true">
            {SEMANA.map((s, i) => (
              <span key={s}>
                <span className={styles.soComputador}>{s}</span>
                <span className={styles.soCelular}>{SEMANA_CURTA[i]}</span>
              </span>
            ))}
          </div>
          <div className={styles.dias}>
            {dias.map((dia, i) => {
              if (!dia) return <span key={`v${i}`} />;
              const doDia = revisoesDoDia(todasRevisoes, dia, hoje);
              const naoFeitas = dia < hoje && doDia.some((r) => !r.feita_em);
              const pontos = Math.min(doDia.length, 4);
              return (
                <button
                  key={dia}
                  type="button"
                  className={`${styles.dia} ${dia === selecionado ? styles.diaSelecionado : ""}`}
                  onClick={() => setSelecionado(dia)}
                  aria-label={`${dataLonga(dia)}: ${doDia.length} ${doDia.length === 1 ? "revisão" : "revisões"}`}
                  aria-pressed={dia === selecionado}
                >
                  <span className={dia === hoje ? styles.diaHoje : styles.diaNumero}>{Number(dia.slice(8))}</span>
                  <span className={styles.diaPontos}>
                    {naoFeitas ? (
                      <span className={styles.ponto_atrasada} />
                    ) : (
                      Array.from({ length: pontos }, (_, k) => (
                        <span key={k} className={dia < hoje ? styles.ponto_passado : styles.ponto_feita} />
                      ))
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.diaSelecionadoCaixa}>
          <div>
            <h3 className="titulo2">{selecionado === hoje ? `Hoje, ${dataLonga(hoje).split(", ")[1]}` : dataLonga(selecionado)}</h3>
            <p className="corpo secundario">
              {listaDia.length} {listaDia.length === 1 ? "revisão" : "revisões"}
              {carga > 0 && ` · ${formatarMinutos(carga * config.minutos_por_revisao)} de revisão`}
            </p>
          </div>
          {listaDia.length ? (
            <ListaRevisoes revisoes={listaDia} diaOriginal={selecionado < hoje} />
          ) : (
            <div className={`cartao ${styles.vazio} ${styles.vazioPequeno}`}>
              <p className="corpo secundario">Nenhuma revisão neste dia.</p>
            </div>
          )}
          {atrasadasHoje.length > 0 && (
            <p className={`legenda secundario ${styles.notaAtraso}`}>
              <span className={styles.ponto} />
              {atrasadasHoje.length === 1
                ? `A revisão atrasada do dia ${atrasadasHoje[0]} aparece também hoje, até ser feita.`
                : "As revisões atrasadas aparecem também hoje, até serem feitas."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
