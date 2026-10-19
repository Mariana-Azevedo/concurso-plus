import { connection } from "next/server";
import { saudacao } from "@/lib/datas";
import { SecaoCalendario } from "./SecaoCalendario";
import { SecaoConteudos } from "./SecaoConteudos";
import { SecaoHoje } from "./SecaoHoje";
import styles from "./app.module.css";

// Página única (Figma v3): Hoje, Conteúdos e Calendário, uma seção embaixo da outra
export default async function PaginaPrincipal() {
  // A saudação depende da hora do pedido
  await connection();
  return (
    <main className={styles.pagina}>
      <SecaoHoje saudacao={saudacao()} />
      <hr className={styles.divisoria} />
      <SecaoConteudos />
      <hr className={styles.divisoria} />
      <SecaoCalendario />
    </main>
  );
}
