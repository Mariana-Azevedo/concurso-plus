"use client";

import { createContext, startTransition, useContext, useMemo, useOptimistic, useState } from "react";
import type { Dados } from "@/lib/dados";
import { limiteRevisoesDia, type Conteudo, type Revisao } from "@/lib/revisoes";
import { marcarRevisao } from "./acoes";

export type Janela =
  | { tipo: "conteudo"; conteudo?: Conteudo }
  | { tipo: "excluir"; conteudo: Conteudo }
  | { tipo: "dificil"; revisao: Revisao; conteudo: Conteudo }
  | { tipo: "anotacoes"; revisao: Revisao; conteudo: Conteudo }
  | null;

type Valor = Dados & {
  hoje: string;
  limite: number;
  todasRevisoes: Revisao[];
  conteudoDe: (r: Revisao) => Conteudo;
  disciplinaDe: (c: Conteudo) => string;
  janela: Janela;
  abrir: (j: Janela) => void;
  fechar: () => void;
  alternarRevisao: (r: Revisao) => void;
  aviso: string | null;
  mostrarAviso: (texto: string) => void;
};

const Contexto = createContext<Valor | null>(null);

export function useApp(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error("useApp fora do ProvedorApp");
  return v;
}

type Mudanca = { id: string; feita_em: string | null };

export function ProvedorApp({ dados, hoje, children }: { dados: Dados; hoje: string; children: React.ReactNode }) {
  const [janela, setJanela] = useState<Janela>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Marcar como feita aparece na hora, antes de o servidor responder
  const [conteudos, aplicar] = useOptimistic(dados.conteudos, (atual: Conteudo[], m: Mudanca) =>
    atual.map((c) =>
      c.revisoes.some((r) => r.id === m.id)
        ? { ...c, revisoes: c.revisoes.map((r) => (r.id === m.id ? { ...r, feita_em: m.feita_em } : r)) }
        : c,
    ),
  );

  const valor = useMemo<Valor>(() => {
    const porId = new Map(conteudos.map((c) => [c.id, c]));
    const nomes = new Map(dados.disciplinas.map((d) => [d.id, d.nome]));
    const todasRevisoes = conteudos.flatMap((c) => c.revisoes);
    const mostrarAviso = (texto: string) => {
      setAviso(texto);
      window.setTimeout(() => setAviso((a) => (a === texto ? null : a)), 4000);
    };

    return {
      ...dados,
      conteudos,
      hoje,
      limite: limiteRevisoesDia(dados.config),
      todasRevisoes,
      conteudoDe: (r) => porId.get(r.conteudo_id)!,
      disciplinaDe: (c) => nomes.get(c.disciplina_id) ?? "",
      janela,
      abrir: setJanela,
      fechar: () => setJanela(null),
      aviso,
      mostrarAviso,
      alternarRevisao: (r) => {
        const feita = !r.feita_em;
        startTransition(async () => {
          aplicar({ id: r.id, feita_em: feita ? hoje : null });
          try {
            const res = await marcarRevisao(r.id, feita);
            if (!res.ok) mostrarAviso(res.erro);
            else if (res.perguntar) {
              const c = porId.get(r.conteudo_id);
              if (c) setJanela({ tipo: "dificil", revisao: r, conteudo: c });
            }
          } catch {
            mostrarAviso("Não foi possível salvar. Confira a internet e tente de novo.");
          }
        });
      },
    };
  }, [dados, conteudos, hoje, janela, aviso, aplicar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
