import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cache, Suspense } from "react";
import { carregarDados } from "@/lib/dados";
import { hojeISO } from "@/lib/datas";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { Aviso } from "./Aviso";
import { Carregando } from "./Carregando";
import { ProvedorApp } from "./Contexto";
import { Janelas } from "./Janelas";
import { Topo } from "./Topo";

export const metadata: Metadata = {
  title: "Minhas revisões",
  robots: { index: false, follow: false },
};

const dadosDaPessoa = cache(carregarDados);

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Carregando />}>
      <AreaLogada>{children}</AreaLogada>
    </Suspense>
  );
}

async function AreaLogada({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigurado) redirect("/login?erro=config");
  const dados = await dadosDaPessoa();
  if (!dados) redirect("/login");

  return (
    <ProvedorApp dados={dados} hoje={hojeISO()}>
      <Topo />
      {children}
      <Janelas />
      <Aviso />
    </ProvedorApp>
  );
}
