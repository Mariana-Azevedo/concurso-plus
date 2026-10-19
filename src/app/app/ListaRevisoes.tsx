"use client";

import { Check } from "lucide-react";
import { estaAtrasada, textoAtraso, type Revisao } from "@/lib/revisoes";
import { useApp } from "./Contexto";
import styles from "./app.module.css";

export function nomeRevisao(numero: number): string {
  return numero > 5 ? "revisão extra" : `${numero}ª revisão`;
}

/** Lista simples de revisões (Figma v3, "Revisão (v2)"): caixa, assunto, detalhe e aviso de atraso. */
export function ListaRevisoes({ revisoes, diaOriginal }: { revisoes: Revisao[]; diaOriginal?: boolean }) {
  const { hoje, conteudoDe, disciplinaDe, alternarRevisao, abrir } = useApp();

  return (
    <ul className={`cartao ${styles.lista}`}>
      {revisoes.map((r) => {
        const c = conteudoDe(r);
        const atrasada = estaAtrasada(r, hoje);
        const feita = Boolean(r.feita_em);
        return (
          <li key={r.id} className={`${styles.item} ${feita ? styles.itemFeito : ""}`}>
            <button
              type="button"
              className={`${styles.caixa} ${atrasada ? styles.caixaAtrasada : ""} ${feita ? styles.caixaFeita : ""}`}
              onClick={() => alternarRevisao(r)}
              aria-label={feita ? `Desmarcar ${c.assunto}` : `Marcar ${c.assunto} como revisado`}
              aria-pressed={feita}
            >
              {feita && <Check size={13} strokeWidth={3} />}
            </button>
            <button
              type="button"
              className={styles.itemTexto}
              onClick={() => abrir({ tipo: "anotacoes", revisao: r, conteudo: c })}
            >
              <span className={styles.assunto}>{c.assunto}</span>
              <span className="legenda secundario">
                {disciplinaDe(c)} · {nomeRevisao(r.numero)}
              </span>
            </button>
            {atrasada && (
              <span className={styles.avisoAtraso}>
                <span className={styles.ponto} />
                {diaOriginal ? (
                  "Não feita"
                ) : (
                  <>
                    <span className={styles.soComputador}>{textoAtraso(r, hoje)}</span>
                    <span className={styles.soCelular}>{textoAtraso(r, hoje).replace("Atrasada há ", "")}</span>
                  </>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
