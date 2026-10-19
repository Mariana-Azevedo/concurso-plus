import type { Metadata } from "next";
import { FormCadastro } from "./FormCadastro";

export const metadata: Metadata = {
  title: "Criar conta grátis",
  description:
    "Crie sua conta grátis no Concurso Plus e deixe o site agendar as revisões de 1, 3, 7 e 15 dias de tudo o que você estudar.",
  alternates: { canonical: "/cadastro" },
};

export default function Cadastro() {
  return <FormCadastro />;
}
