// Regras de revisão espaçada do Concurso Plus (seções 3 e 4 do plano).
// Funções puras: não acessam o banco, para poderem ser testadas.

import { diasEntre, somarDias } from "./datas";

/** Dias depois da data de estudo para cada revisão (1ª a 5ª). */
export const INTERVALOS = [0, 1, 3, 7, 15] as const;
/** Revisão extra para conteúdo "ainda difícil": dias depois da última. */
export const DIAS_REVISAO_EXTRA = 15;

export type Tema = "claro" | "escuro" | "automatico";

export type Config = {
  horas_estudo_dia: number;
  minutos_por_revisao: number;
  tema: Tema;
};

export const CONFIG_PADRAO: Config = { horas_estudo_dia: 4, minutos_por_revisao: 30, tema: "automatico" };

export type Disciplina = { id: string; nome: string };

export type Revisao = {
  id: string;
  conteudo_id: string;
  numero: number;
  data_prevista: string;
  feita_em: string | null;
  achou_dificil: boolean | null;
};

export type Conteudo = {
  id: string;
  disciplina_id: string;
  assunto: string;
  data_estudo: string;
  anotacoes: string | null;
  status: "em_revisao" | "concluido";
  criado_em: string;
  revisoes: Revisao[];
};

/** Datas das 5 revisões a partir da data de estudo. */
export function datasRevisoes(dataEstudo: string): string[] {
  return INTERVALOS.map((d) => somarDias(dataEstudo, d));
}

/** Quantas revisões cabem por dia: metade do tempo de estudo dividida pelo tempo de cada revisão. */
export function limiteRevisoesDia(cfg: Pick<Config, "horas_estudo_dia" | "minutos_por_revisao">): number {
  if (cfg.minutos_por_revisao <= 0) return 0;
  return Math.floor((cfg.horas_estudo_dia * 60) / 2 / cfg.minutos_por_revisao);
}

export function estaAtrasada(r: Revisao, hoje: string): boolean {
  return !r.feita_em && r.data_prevista < hoje;
}

/** A 1ª revisão é feita no cadastro e não entra na lista nem na carga do dia. */
function contaNaLista(r: Revisao): boolean {
  return r.numero > 1;
}

/**
 * Revisões que aparecem num dia.
 * No dia de hoje entram também as atrasadas, até serem feitas.
 */
export function revisoesDoDia(todas: Revisao[], dia: string, hoje: string): Revisao[] {
  return todas.filter((r) => {
    if (!contaNaLista(r)) return false;
    if (r.data_prevista === dia) {
      // No dia original, uma atrasada continua aparecendo (como "não feita")
      return true;
    }
    return dia === hoje && estaAtrasada(r, hoje);
  });
}

/** Ordem da lista do dia: atrasadas primeiro, depois pendentes, e as feitas no fim. */
export function ordenarLista(lista: Revisao[], hoje: string, nomeDe: (r: Revisao) => string): Revisao[] {
  const peso = (r: Revisao) => (r.feita_em ? 2 : estaAtrasada(r, hoje) ? 0 : 1);
  return [...lista].sort(
    (a, b) =>
      peso(a) - peso(b) ||
      a.data_prevista.localeCompare(b.data_prevista) ||
      nomeDe(a).localeCompare(nomeDe(b), "pt-BR"),
  );
}

/**
 * Carga de um dia: revisões marcadas para ele (feitas ou não).
 * Em hoje, soma as atrasadas de dias anteriores que ainda não foram feitas.
 */
export function cargaDoDia(todas: Revisao[], dia: string, hoje: string): number {
  return todas.filter((r) => {
    if (!contaNaLista(r)) return false;
    if (dia === hoje) return r.data_prevista === hoje || estaAtrasada(r, hoje);
    return r.data_prevista === dia;
  }).length;
}

export type ResultadoLimite = { ok: true } | { ok: false; dia: string; carga: number; limite: number };

/**
 * Confere se as novas revisões (sem a 1ª) cabem no limite de cada dia.
 * Revisões que já venceram (data passada) contam no dia de hoje.
 */
export function verificarLimite(
  todas: Revisao[],
  novasDatas: string[],
  hoje: string,
  limite: number,
): ResultadoLimite {
  const extra = new Map<string, number>();
  for (const d of novasDatas) {
    const dia = d < hoje ? hoje : d;
    extra.set(dia, (extra.get(dia) ?? 0) + 1);
  }
  const dias = [...extra.keys()].sort();
  for (const dia of dias) {
    const carga = cargaDoDia(todas, dia, hoje);
    if (carga + (extra.get(dia) ?? 0) > limite) {
      return { ok: false, dia, carga, limite };
    }
  }
  return { ok: true };
}

/** Novas datas das revisões pendentes (2ª a 5ª) quando a data de estudo muda. As feitas não mudam. */
export function recalcularPendentes(revisoes: Revisao[], novaDataEstudo: string): { id: string; data_prevista: string }[] {
  return revisoes
    .filter((r) => !r.feita_em && r.numero >= 2 && r.numero <= INTERVALOS.length)
    .map((r) => ({ id: r.id, data_prevista: somarDias(novaDataEstudo, INTERVALOS[r.numero - 1]) }));
}

/** Depois da 5ª revisão (ou de uma extra), pergunta se o conteúdo ainda é difícil. */
export function perguntaDificil(r: Revisao): boolean {
  return r.numero >= INTERVALOS.length;
}

export type StatusConteudo = "em_revisao" | "atrasado" | "dificil" | "concluido";

export function statusConteudo(c: Conteudo, hoje: string): StatusConteudo {
  if (c.status === "concluido") return "concluido";
  if (c.revisoes.some((r) => estaAtrasada(r, hoje))) return "atrasado";
  if (c.revisoes.some((r) => r.achou_dificil)) return "dificil";
  return "em_revisao";
}

export function proximaRevisao(c: Conteudo): Revisao | undefined {
  return [...c.revisoes]
    .filter((r) => !r.feita_em)
    .sort((a, b) => a.data_prevista.localeCompare(b.data_prevista))[0];
}

export type Ponto = "feita" | "atrasada" | "afazer";

export function pontosRevisoes(c: Conteudo, hoje: string): Ponto[] {
  return [...c.revisoes]
    .sort((a, b) => a.numero - b.numero)
    .map((r) => (r.feita_em ? "feita" : estaAtrasada(r, hoje) ? "atrasada" : "afazer"));
}

export function textoAtraso(r: Revisao, hoje: string): string {
  const dias = diasEntre(r.data_prevista, hoje);
  return dias === 1 ? "Atrasada há 1 dia" : `Atrasada há ${dias} dias`;
}

/** Contagem de revisões por dia nos 7 dias da semana atual (domingo a sábado). */
export function revisoesDaSemana(todas: Revisao[], hoje: string): { dia: string; total: number }[] {
  const diaSemana = new Date(`${hoje}T12:00:00`).getDay();
  const domingo = somarDias(hoje, -diaSemana);
  return Array.from({ length: 7 }, (_, i) => {
    const dia = somarDias(domingo, i);
    return { dia, total: todas.filter((r) => contaNaLista(r) && r.data_prevista === dia).length };
  });
}
