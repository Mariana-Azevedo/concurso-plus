"use client";

import { Mail, User } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { BotaoGoogle } from "@/components/BotaoGoogle";
import { CampoSenha } from "@/components/CampoSenha";
import { cadastrar, type EstadoForm } from "../acoes";
import styles from "../entrar.module.css";

export function FormCadastro() {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(cadastrar, {});

  if (estado.aviso) {
    return (
      <div className={styles.form}>
        <h1 className="titulo1">Confira seu e-mail</h1>
        <p className="sucesso">{estado.aviso}</p>
        <p className={styles.rodape}>
          Já confirmou? <Link href="/login">Entrar</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <div className={styles.cabecalho}>
        <h1 className="titulo1">Criar conta</h1>
        <p className="corpo secundario">Grátis. Seus dados ficam salvos para usar em qualquer aparelho.</p>
      </div>
      <BotaoGoogle />
      <p className={styles.ou}>ou</p>
      <form action={acao} className={styles.form}>
        <div className="campo">
          <label htmlFor="nome">Nome</label>
          <div className={styles.entradaIcone}>
            <User size={18} />
            <input id="nome" name="nome" className="entrada" autoComplete="given-name" required maxLength={60} />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <div className={styles.entradaIcone}>
            <Mail size={18} />
            <input id="email" name="email" type="email" className="entrada" autoComplete="email" required />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <CampoSenha id="senha" name="senha" autoComplete="new-password" placeholder="Pelo menos 8 caracteres" />
        </div>
        {estado.erro && (
          <p className="erro" role="alert">
            {estado.erro}
          </p>
        )}
        <button type="submit" className={`botao botao-primario ${styles.enviar}`} disabled={enviando}>
          {enviando ? "Criando…" : "Criar conta"}
        </button>
      </form>
      <p className={styles.rodape}>
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </div>
  );
}
