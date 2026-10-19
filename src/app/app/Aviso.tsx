"use client";

import { useApp } from "./Contexto";
import styles from "./app.module.css";

/** Mensagem curta no canto da tela (ex.: erro ao salvar). */
export function Aviso() {
  const { aviso } = useApp();
  if (!aviso) return null;
  return (
    <div className={styles.aviso} role="status">
      {aviso}
    </div>
  );
}
