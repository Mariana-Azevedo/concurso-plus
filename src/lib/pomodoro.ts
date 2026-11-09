"use client";

// Pomodoro: tipos, tempo guardado no navegador, som e relógio compartilhado.

import { useSyncExternalStore } from "react";

export type Pomodoro = {
  revisaoId: string;
  fase: "foco" | "pausa";
  /** Quando a fase termina (milissegundos). */
  fimEm: number;
  focoMin: number;
  pausaMin: number;
  /** A fase acabou e a pessoa ainda não respondeu. */
  terminou: boolean;
};

export type TemposPomodoro = { foco: number; pausa: number };

export const TEMPOS_PADRAO: TemposPomodoro = { foco: 25, pausa: 5 };
export const FOCO_MIN = 1;
export const FOCO_MAX = 120;
export const PAUSA_MIN = 0;
export const PAUSA_MAX = 60;

const CHAVE_ANDAMENTO = "cp-pomodoro";
const CHAVE_TEMPOS = "cp-pomodoro-tempos";

function dentro(n: unknown, min: number, max: number, padrao: number): number {
  return typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : padrao;
}

export function lerTempos(): TemposPomodoro {
  try {
    const bruto = window.localStorage.getItem(CHAVE_TEMPOS);
    if (!bruto) return TEMPOS_PADRAO;
    const t = JSON.parse(bruto) as Partial<TemposPomodoro>;
    return {
      foco: dentro(t.foco, FOCO_MIN, FOCO_MAX, TEMPOS_PADRAO.foco),
      pausa: dentro(t.pausa, PAUSA_MIN, PAUSA_MAX, TEMPOS_PADRAO.pausa),
    };
  } catch {
    return TEMPOS_PADRAO;
  }
}

export function guardarTempos(t: TemposPomodoro) {
  try {
    window.localStorage.setItem(CHAVE_TEMPOS, JSON.stringify(t));
  } catch {}
}

export function lerAndamento(): Pomodoro | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE_ANDAMENTO);
    if (!bruto) return null;
    const p = JSON.parse(bruto) as Partial<Pomodoro>;
    if (typeof p.revisaoId !== "string" || typeof p.fimEm !== "number") return null;
    if (p.fase !== "foco" && p.fase !== "pausa") return null;
    return {
      revisaoId: p.revisaoId,
      fase: p.fase,
      fimEm: p.fimEm,
      focoMin: dentro(p.focoMin, FOCO_MIN, FOCO_MAX, TEMPOS_PADRAO.foco),
      pausaMin: dentro(p.pausaMin, PAUSA_MIN, PAUSA_MAX, TEMPOS_PADRAO.pausa),
      terminou: Boolean(p.terminou),
    };
  } catch {
    return null;
  }
}

export function guardarAndamento(p: Pomodoro | null) {
  try {
    if (p) window.localStorage.setItem(CHAVE_ANDAMENTO, JSON.stringify(p));
    else window.localStorage.removeItem(CHAVE_ANDAMENTO);
  } catch {}
}

/** 24:05 */
export function formatarRelogio(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// --- Relógio compartilhado: um único intervalo para quem mostra a contagem ---

const ouvintes = new Set<() => void>();
let intervalo: ReturnType<typeof setInterval> | undefined;

function assinar(aoMudar: () => void) {
  ouvintes.add(aoMudar);
  if (ouvintes.size === 1) intervalo = setInterval(() => ouvintes.forEach((f) => f()), 1000);
  return () => {
    ouvintes.delete(aoMudar);
    if (ouvintes.size === 0 && intervalo) {
      clearInterval(intervalo);
      intervalo = undefined;
    }
  };
}

/** Hora atual em milissegundos, atualizada a cada segundo. */
export function useAgora(): number {
  return useSyncExternalStore(
    assinar,
    () => Math.floor(Date.now() / 1000) * 1000,
    () => 0,
  );
}

// --- Som e aviso ---

let audio: AudioContext | undefined;

/** Chamar num clique (o navegador só libera o som depois de uma ação da pessoa). */
export function prepararAvisos() {
  try {
    audio ??= new AudioContext();
    void audio.resume();
  } catch {}
  try {
    if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
  } catch {}
}

export function tocarSom() {
  try {
    const ctx = audio;
    if (!ctx || ctx.state !== "running") return;
    const inicio = ctx.currentTime;
    [0, 0.35, 0.7].forEach((atraso) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      ganho.gain.setValueAtTime(0.0001, inicio + atraso);
      ganho.gain.exponentialRampToValueAtTime(0.25, inicio + atraso + 0.03);
      ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + atraso + 0.3);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(inicio + atraso);
      osc.stop(inicio + atraso + 0.32);
    });
  } catch {}
}

export function avisarNoNavegador(titulo: string, texto: string) {
  try {
    if ("Notification" in window && Notification.permission === "granted") new Notification(titulo, { body: texto });
  } catch {}
}
