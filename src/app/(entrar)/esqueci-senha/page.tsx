"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { pedirNovaSenha, type EstadoForm } from "../acoes";
import styles from "../entrar.module.css";

export default function EsqueciSenha() {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(pedirNovaSenha, {});
  return (
    <form action={acao} className={styles.form}>
      <title>Esqueci minha senha · Concurso Plus</title>
      <meta name="robots" content="noindex" />
      <div className={styles.cabecalho}>
        <h1 className="titulo1">Esqueci minha senha</h1>
        <p className="corpo secundario">Vamos enviar um link para você criar uma senha nova.</p>
      </div>
      <div className="campo">
        <label htmlFor="email">E-mail</label>
        <div className={styles.entradaIcone}>
          <Mail size={18} />
          <input id="email" name="email" type="email" className="entrada" autoComplete="email" required />
        </div>
      </div>
      {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
      {estado.aviso && <p className="sucesso" role="status">{estado.aviso}</p>}
      <button type="submit" className={`botao botao-primario ${styles.enviar}`} disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar link"}
      </button>
      <p className={styles.rodape}>
        Lembrou? <Link href="/login">Entrar</Link>
      </p>
    </form>
  );
}
