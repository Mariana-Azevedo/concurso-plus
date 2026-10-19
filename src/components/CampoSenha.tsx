"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import styles from "@/app/(entrar)/entrar.module.css";

export function CampoSenha({
  id,
  name,
  autoComplete,
  placeholder,
}: {
  id: string;
  name: string;
  autoComplete: string;
  placeholder?: string;
}) {
  const [ver, setVer] = useState(false);
  return (
    <div className={styles.entradaIcone}>
      <Lock size={18} />
      <input
        id={id}
        name={name}
        type={ver ? "text" : "password"}
        className="entrada"
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        minLength={8}
      />
      <button
        type="button"
        className={`botao-icone ${styles.olho}`}
        onClick={() => setVer((v) => !v)}
        aria-label={ver ? "Esconder senha" : "Mostrar senha"}
      >
        {ver ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
