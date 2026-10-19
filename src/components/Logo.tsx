import { GraduationCap } from "lucide-react";
import styles from "./Logo.module.css";

export function Logo({ tamanho = 32, texto = true }: { tamanho?: number; texto?: boolean }) {
  return (
    <span className={styles.logo}>
      <span className={styles.icone} style={{ width: tamanho, height: tamanho }}>
        <GraduationCap size={Math.round(tamanho * 0.56)} strokeWidth={2.2} />
      </span>
      {texto && <span className={`${styles.nome} logo-nome`}>Concurso Plus</span>}
    </span>
  );
}
