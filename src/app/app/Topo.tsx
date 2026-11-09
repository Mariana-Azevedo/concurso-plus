"use client";

import { Coffee, LogOut, Moon, Settings, Sun, Timer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/Logo";
import { formatarRelogio, useAgora, type Pomodoro } from "@/lib/pomodoro";
import { aplicarTema, temaAtualEscuro } from "@/lib/tema";
import { sair } from "../(entrar)/acoes";
import { salvarTema } from "./acoes";
import { useApp } from "./Contexto";
import styles from "./app.module.css";

const SECOES = [
  { id: "hoje", nome: "Hoje" },
  { id: "conteudos", nome: "Conteúdos" },
  { id: "calendario", nome: "Calendário" },
];

/** Avisa quando o tema da página muda (botão, configurações ou o aparelho). */
function observarTema(aoMudar: () => void) {
  const obs = new MutationObserver(aoMudar);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });
  const midia = window.matchMedia("(prefers-color-scheme: dark)");
  midia.addEventListener("change", aoMudar);
  return () => {
    obs.disconnect();
    midia.removeEventListener("change", aoMudar);
  };
}

/** Contagem do pomodoro sempre à vista; clicar abre a revisão. */
function ChipPomodoro() {
  const { pomodoro, todasRevisoes, conteudoDe, abrir } = useApp();
  const r = pomodoro ? todasRevisoes.find((x) => x.id === pomodoro.revisaoId) : undefined;
  if (!pomodoro || !r) return null;
  return <ChipContando pomodoro={pomodoro} aoClicar={() => abrir({ tipo: pomodoro.terminou ? "pomodoroFim" : "revisao", revisao: r, conteudo: conteudoDe(r) })} assunto={conteudoDe(r).assunto} />;
}

function ChipContando({ pomodoro, assunto, aoClicar }: { pomodoro: Pomodoro; assunto: string; aoClicar: () => void }) {
  const agora = useAgora();
  const texto = pomodoro.terminou ? "Terminou!" : formatarRelogio(pomodoro.fimEm - agora);
  return (
    <button
      type="button"
      className={`${styles.chipPomodoro} ${pomodoro.fase === "pausa" ? styles.chipPausa : ""} ${pomodoro.terminou ? styles.chipTerminou : ""}`}
      onClick={aoClicar}
      title={`${pomodoro.fase === "foco" ? "Foco" : "Pausa"} · ${assunto}`}
      aria-label={`Pomodoro: ${pomodoro.fase === "foco" ? "foco" : "pausa"}, ${texto}. Abrir revisão de ${assunto}`}
    >
      {pomodoro.fase === "foco" ? <Timer size={16} /> : <Coffee size={16} />}
      <span>{texto}</span>
    </button>
  );
}

export function Topo() {
  const { usuario, config } = useApp();
  const naPrincipal = usePathname() === "/app";
  const [ativa, setAtiva] = useState("hoje");
  const escuro = useSyncExternalStore(observarTema, temaAtualEscuro, () => false);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // O tema salvo na conta vale em qualquer aparelho
  useEffect(() => {
    aplicarTema(config.tema);
  }, [config.tema]);

  // Destaca a aba da seção que está na tela
  useEffect(() => {
    if (!naPrincipal) return;
    const alvos = SECOES.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visivel) setAtiva(visivel.target.id);
      },
      { rootMargin: "-90px 0px -55% 0px" },
    );
    alvos.forEach((a) => observador.observe(a));
    return () => observador.disconnect();
  }, [naPrincipal]);

  useEffect(() => {
    if (!menuAberto) return;
    const fora = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuAberto(false);
    };
    document.addEventListener("click", fora);
    return () => document.removeEventListener("click", fora);
  }, [menuAberto]);

  function trocarTema() {
    const novo = escuro ? "claro" : "escuro";
    aplicarTema(novo);
    void salvarTema(novo);
  }

  return (
    <header className={styles.topo}>
      <div className={styles.topoDentro}>
        <Link href="/app" className={styles.topoLogo} aria-label="Concurso Plus, hoje">
          <Logo />
        </Link>
        <nav className={styles.abas} aria-label="Seções">
          {SECOES.map((s) => (
            <a
              key={s.id}
              href={naPrincipal ? `#${s.id}` : `/app#${s.id}`}
              className={naPrincipal && ativa === s.id ? styles.abaAtiva : styles.aba}
              aria-current={naPrincipal && ativa === s.id ? "true" : undefined}
              onClick={() => naPrincipal && setAtiva(s.id)}
            >
              {s.nome}
            </a>
          ))}
        </nav>
        <div className={styles.topoAcoes}>
          <ChipPomodoro />
          <button type="button" className={`botao-icone ${styles.soComputador}`} onClick={trocarTema} aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"}>
            {escuro ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link href="/app/configuracoes" className={`botao-icone ${styles.soComputador}`} aria-label="Configurações">
            <Settings size={20} />
          </Link>
          <div className={styles.avatarCaixa} ref={menuRef}>
            <button
              type="button"
              className={styles.avatar}
              onClick={() => setMenuAberto((v) => !v)}
              aria-label="Menu da conta"
              aria-expanded={menuAberto}
            >
              {usuario.nome.charAt(0).toUpperCase()}
            </button>
            {menuAberto && (
              <div className={`cartao ${styles.menuConta}`}>
                <div className={styles.menuContaTopo}>
                  <p className="corpo-forte">{usuario.nome}</p>
                  <p className="legenda secundario">{usuario.email}</p>
                </div>
                <button type="button" className={styles.menuItem} onClick={trocarTema}>
                  {escuro ? <Sun size={18} /> : <Moon size={18} />} {escuro ? "Tema claro" : "Tema escuro"}
                </button>
                <Link href="/app/configuracoes" className={styles.menuItem} onClick={() => setMenuAberto(false)}>
                  <Settings size={18} /> Configurações
                </Link>
                <form action={sair}>
                  <button type="submit" className={`${styles.menuItem} ${styles.menuSair}`}>
                    <LogOut size={18} /> Sair da conta
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
