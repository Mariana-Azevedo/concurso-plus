import type { Metadata } from "next";
import { Suspense } from "react";
import { FormEntrar } from "./FormEntrar";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre no Concurso Plus para ver as suas revisões de hoje.",
  alternates: { canonical: "/login" },
};

const ERROS: Record<string, string> = {
  link: "O link expirou ou já foi usado. Tente de novo.",
  google: "Não foi possível entrar com o Google. Tente de novo.",
  config: "O site ainda não está ligado ao Supabase. Veja o LEIAME do projeto.",
};

type Params = Promise<Record<string, string | string[] | undefined>>;

export default function Login({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense fallback={<FormEntrar />}>
      <LoginComEndereco searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginComEndereco({ searchParams }: { searchParams: Params }) {
  const { voltar, erro } = await searchParams;
  return (
    <FormEntrar
      voltar={typeof voltar === "string" ? voltar : undefined}
      erroInicial={typeof erro === "string" ? ERROS[erro] : undefined}
    />
  );
}
