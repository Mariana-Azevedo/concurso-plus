import type { Tema } from "./revisoes";

export const CHAVE_TEMA = "concurso-plus-tema";

/** Aplica o tema na página e guarda neste aparelho. */
export function aplicarTema(tema: Tema) {
  const html = document.documentElement;
  if (tema === "automatico") html.removeAttribute("data-tema");
  else html.setAttribute("data-tema", tema);
  try {
    localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // Sem acesso ao armazenamento: o tema vale só nesta visita
  }
}

export function temaAtualEscuro(): boolean {
  const attr = document.documentElement.getAttribute("data-tema");
  if (attr) return attr === "escuro";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Roda antes da página aparecer, para não piscar o tema errado. */
export const SCRIPT_TEMA = `try{var t=localStorage.getItem("${CHAVE_TEMA}");if(t==="claro"||t==="escuro")document.documentElement.setAttribute("data-tema",t)}catch(e){}`;
