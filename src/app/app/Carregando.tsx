import { Logo } from "@/components/Logo";
import styles from "./app.module.css";

/** Aparece por um instante enquanto as revisões são carregadas. */
export function Carregando() {
  return (
    <div className={styles.carregando} role="status" aria-label="Carregando">
      <Logo tamanho={44} texto={false} />
    </div>
  );
}
