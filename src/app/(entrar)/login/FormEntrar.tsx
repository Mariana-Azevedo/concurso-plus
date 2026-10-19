"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { BotaoGoogle } from "@/components/BotaoGoogle";
import { CampoSenha } from "@/components/CampoSenha";
import { entrar, type EstadoForm } from "../acoes";
import styles from "../entrar.module.css";

export function FormEntrar({ voltar, erroInicial }: { voltar?: string; erroInicial?: string }) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(entrar, { erro: erroInicial });

  return (
    <div className={styles.form}>
      <div className={styles.cabecalho}>
        <h1 className="titulo1">Entrar</h1>
        <p className="corpo secundario">Acesse suas revisões no computador ou no celular.</p>
      </div>
      <BotaoGoogle voltar={voltar} />
      <p className={styles.ou}>ou</p>
      <form action={acao} className={styles.form}>
        <input type="hidden" name="voltar" value={voltar ?? ""} />
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <div className={styles.entradaIcone}>
            <Mail size={18} />
            <input id="email" name="email" type="email" className="entrada" autoComplete="email" required />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <CampoSenha id="senha" name="senha" autoComplete="current-password" />
        </div>
        <Link href="/esqueci-senha" className={styles.linkDireita}>
          Esqueci minha senha
        </Link>
        {estado.erro && (
          <p className="erro" role="alert">
            {estado.erro}
          </p>
        )}
        <button type="submit" className={`botao botao-primario ${styles.enviar}`} disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className={styles.rodape}>
        Não tem conta? <Link href="/cadastro">Criar conta</Link>
      </p>
    </div>
  );
}
