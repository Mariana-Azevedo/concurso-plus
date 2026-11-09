"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { dataCurta, dataLonga, diasDoMes, mesAno } from "@/lib/datas";
import styles from "./SeletorData.module.css";

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Calendário em janela suspensa para escolher uma data (AAAA-MM-DD), no visual do calendário do site. */
export function SeletorData({
  id,
  valor,
  max,
  hoje,
  aoMudar,
  ref,
}: {
  id: string;
  valor: string;
  /** Última data permitida. */
  max: string;
  hoje: string;
  aoMudar: (data: string) => void;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const [aberto, setAberto] = useState(false);
  const [ano, setAno] = useState(Number((valor || hoje).slice(0, 4)));
  const [mes, setMes] = useState(Number((valor || hoje).slice(5, 7)) - 1);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  function alternar() {
    if (!aberto) {
      // Abre no mês da data escolhida
      setAno(Number((valor || hoje).slice(0, 4)));
      setMes(Number((valor || hoje).slice(5, 7)) - 1);
    }
    setAberto(!aberto);
  }

  function mudarMes(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
  }

  const maxAno = Number(max.slice(0, 4));
  const maxMes = Number(max.slice(5, 7)) - 1;
  const ehUltimoMes = ano > maxAno || (ano === maxAno && mes >= maxMes);

  return (
    <div
      className={styles.caixa}
      ref={caixa}
      onKeyDown={(e) => {
        if (e.key === "Escape" && aberto) {
          // Fecha só o calendário, sem fechar a janela de trás
          e.preventDefault();
          e.stopPropagation();
          setAberto(false);
        }
      }}
    >
      <button
        type="button"
        id={id}
        ref={ref}
        className={`entrada ${styles.gatilho}`}
        onClick={alternar}
        aria-haspopup="dialog"
        aria-expanded={aberto}
      >
        <CalendarDays size={18} />
        <span>{valor ? dataCurta(valor) : "Escolha a data"}</span>
      </button>

      {aberto && (
        <div className={`cartao ${styles.janela}`} role="dialog" aria-label="Escolher a data de estudo">
          <div className={styles.topo}>
            <h3 className="titulo3" aria-live="polite">
              {mesAno(ano, mes)}
            </h3>
            <div>
              <button type="button" className="botao-icone" onClick={() => mudarMes(-1)} aria-label="Mês anterior">
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="botao-icone"
                onClick={() => mudarMes(1)}
                aria-label="Próximo mês"
                disabled={ehUltimoMes}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className={styles.semana} aria-hidden="true">
            {SEMANA.map((s, i) => (
              <span key={i}>{s}</span>
            ))}
          </div>
          <div className={styles.dias}>
            {diasDoMes(ano, mes).map((dia, i) => {
              if (!dia) return <span key={`v${i}`} />;
              const bloqueado = dia > max;
              const escolhido = dia === valor;
              return (
                <button
                  key={dia}
                  type="button"
                  disabled={bloqueado}
                  className={`${styles.dia} ${escolhido ? styles.diaEscolhido : ""} ${dia === hoje ? styles.diaHoje : ""}`}
                  onClick={() => {
                    aoMudar(dia);
                    setAberto(false);
                  }}
                  aria-label={dataLonga(dia)}
                  aria-pressed={escolhido}
                >
                  {Number(dia.slice(8))}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={styles.atalho}
            onClick={() => {
              aoMudar(hoje);
              setAberto(false);
            }}
          >
            Hoje
          </button>
        </div>
      )}
    </div>
  );
}
