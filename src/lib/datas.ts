// Datas no formato AAAA-MM-DD, sempre no horário de Brasília.
// Trabalhar com texto evita erros de fuso horário entre celular e computador.

import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const FUSO = "America/Sao_Paulo";

/** Data de hoje em Brasília, no formato AAAA-MM-DD. */
export function hojeISO(agora: Date = new Date()): string {
  // en-CA formata como AAAA-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

/** Hora atual em Brasília (0 a 23). */
export function horaBrasilia(agora: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: FUSO, hour: "2-digit", hourCycle: "h23" }).format(agora),
  );
}

function paraData(iso: string): Date {
  // Meio-dia evita qualquer problema de horário de verão
  return parseISO(`${iso}T12:00:00`);
}

export function somarDias(iso: string, dias: number): string {
  return format(addDays(paraData(iso), dias), "yyyy-MM-dd");
}

export function diasEntre(deISO: string, ateISO: string): number {
  return differenceInCalendarDays(paraData(ateISO), paraData(deISO));
}

/** 17/10 */
export function diaMes(iso: string): string {
  return format(paraData(iso), "dd/MM");
}

/** 17/10/2026 */
export function dataCurta(iso: string): string {
  return format(paraData(iso), "dd/MM/yyyy");
}

/** Sábado, 17 de outubro */
export function dataLonga(iso: string): string {
  const texto = format(paraData(iso), "EEEE, d 'de' MMMM", { locale: ptBR });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Outubro 2026 */
export function mesAno(ano: number, mes: number): string {
  const texto = format(new Date(ano, mes, 1, 12), "MMMM yyyy", { locale: ptBR });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function saudacao(agora: Date = new Date()): string {
  const h = horaBrasilia(agora);
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** Dias de um mês para o calendário, com espaços vazios antes do dia 1. */
export function diasDoMes(ano: number, mes: number): (string | null)[] {
  const primeiro = new Date(ano, mes, 1, 12);
  const total = new Date(ano, mes + 1, 0, 12).getDate();
  const vazios = primeiro.getDay(); // 0 = domingo
  const dias: (string | null)[] = Array.from({ length: vazios }, () => null);
  for (let d = 1; d <= total; d++) {
    dias.push(format(new Date(ano, mes, d, 12), "yyyy-MM-dd"));
  }
  return dias;
}

/** Formata minutos como "2h", "1h 30" ou "45 min". */
export function formatarMinutos(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, "0")}`;
}

/** Dom, 18/10 */
export function diaSemanaCurto(iso: string): string {
  const nomes = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const d = paraData(iso);
  return `${nomes[d.getDay()]}, ${format(d, "dd/MM")}`;
}
