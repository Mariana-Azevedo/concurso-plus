"use client";

import { useActionState } from "react";
import { CampoSenha } from "@/components/CampoSenha";
import { salvarNovaSenha, type EstadoForm } from "../acoes";
import styles from "../entrar.module.css";

export default function RedefinirSenha() {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(salvarNovaSenha, {});
  return (
    <form action={acao} className={styles.form}>
      <title>Nova senha · Concurso Plus</title>
      <meta name="robots" content="noindex" />
      <div className={styles.cabecalho}>
        <h1 className="titulo1">Criar nova senha</h1>
        <p className="corpo secundario">Escolha uma senha com pelo menos 8 caracteres.</p>
      </div>
      <div className="campo">
        <label htmlFor="senha">Nova senha</label>
        <CampoSenha id="senha" name="senha" autoComplete="new-password" />
      </div>
      <div className="campo">
        <label htmlFor="confirmar">Repita a nova senha</label>
        <CampoSenha id="confirmar" name="confirmar" autoComplete="new-password" />
      </div>
      {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
      <button type="submit" className={`botao botao-primario ${styles.enviar}`} disabled={enviando}>
        {enviando ? "Salvando…" : "Salvar senha"}
      </button>
    </form>
  );
}
