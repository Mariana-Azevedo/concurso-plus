import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import styles from "./entrar.module.css";

const REVISOES = [
  ["1ª", "Dia 0"],
  ["2ª", "+1 dia"],
  ["3ª", "+3 dias"],
  ["4ª", "+7 dias"],
  ["5ª", "+15 dias"],
];

// Login (Figma v1, "Login"): painel com degradê à esquerda e formulário à direita
export default function LayoutEntrar({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.tela}>
      <aside className={styles.painel}>
        <Link href="/" className={styles.logo} aria-label="Concurso Plus, página inicial">
          <span className={styles.logoIcone}>
            <GraduationCap size={24} strokeWidth={2.2} />
          </span>
          Concurso Plus
        </Link>
        <p className={styles.frase}>
          Revise no tempo certo.
          <br />
          Não esqueça nada.
        </p>
        <p className={styles.texto}>Cadastre o que estudou e o Concurso Plus agenda as suas 5 revisões automaticamente.</p>
        <ul className={styles.chips}>
          {REVISOES.map(([n, d]) => (
            <li key={n}>
              <strong>{n}</strong>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </aside>
      <main className={styles.lado}>
        <Link href="/" className={styles.logoCelular}>
          <Logo />
        </Link>
        <div className={styles.caixa}>{children}</div>
      </main>
    </div>
  );
}
