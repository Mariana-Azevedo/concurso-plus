import type { Metadata } from "next";
import Link from "next/link";
import {
  AlarmClock,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Flame,
  ListChecks,
  Plus,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { SITE_DESCRICAO, SITE_NOME, SITE_URL } from "@/lib/site";
import styles from "./inicio.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: SITE_NOME,
    title: `${SITE_NOME}: estude uma vez, revise no tempo certo`,
    description: SITE_DESCRICAO,
  },
  twitter: { card: "summary_large_image" },
};

const PASSOS = [
  { titulo: "Cadastre o que estudou", texto: "Disciplina, assunto e anotações. Leva menos de um minuto." },
  {
    titulo: "O site agenda as revisões",
    texto: "A 1ª já conta como feita. As outras ficam para 1, 3, 7 e 15 dias depois.",
  },
  {
    titulo: "Revise o que aparece hoje",
    texto: "Abra o site, siga a lista do dia e marque o que fez. As atrasadas vêm primeiro.",
  },
];

const LINHA_DO_TEMPO = [
  { marca: null, data: "17/10", quando: "No dia" },
  { marca: "2ª", data: "18/10", quando: "+1 dia" },
  { marca: "3ª", data: "20/10", quando: "+3 dias" },
  { marca: "4ª", data: "24/10", quando: "+7 dias" },
  { marca: "5ª", data: "01/11", quando: "+15 dias" },
];

const RECURSOS = [
  { icone: ListChecks, titulo: "Lista do dia", texto: "Só o que precisa ser revisado hoje, sem distração." },
  { icone: TriangleAlert, titulo: "Atrasadas em destaque", texto: "Revisão esquecida aparece no topo até ser feita." },
  { icone: CalendarDays, titulo: "Calendário", texto: "Veja as revisões de cada dia do mês." },
  { icone: Clock, titulo: "Limite diário", texto: "Revisões usam no máximo metade do seu tempo de estudo." },
  { icone: Flame, titulo: "Conteúdo difícil", texto: "Ainda com dúvida? Ganhe uma revisão extra." },
  { icone: Smartphone, titulo: "Celular e modo escuro", texto: "Use em qualquer aparelho, de dia ou de noite." },
];

const PERGUNTAS = [
  { pergunta: "É grátis?", resposta: "Sim. Você cria a conta e usa tudo sem pagar." },
  {
    pergunta: "O que é revisão espaçada?",
    resposta:
      "É revisar o mesmo conteúdo em intervalos que vão aumentando: logo depois de estudar, 1 dia depois, 3, 7 e 15 dias depois. Cada revisão acontece quando você está começando a esquecer, e isso fixa o conteúdo na memória por muito mais tempo.",
  },
  {
    pergunta: "Funciona no celular?",
    resposta: "Sim. O site se ajusta à tela do celular e do computador, e você entra com a mesma conta nos dois.",
  },
  {
    pergunta: "Meus dados ficam salvos?",
    resposta:
      "Sim. Tudo fica guardado na nuvem, na sua conta, e só você vê os seus conteúdos e revisões.",
  },
  {
    pergunta: "E se eu esquecer uma revisão?",
    resposta:
      "Ela aparece em destaque no topo da lista de hoje, com quantos dias está atrasada, até você marcar como feita. As próximas revisões continuam nas datas certas.",
  },
];

const PREVIA = [
  { assunto: "Atos administrativos", detalhe: "Direito Administrativo · 3ª revisão", atrasada: true },
  { assunto: "Direitos e garantias fundamentais", detalhe: "Direito Constitucional · 2ª revisão" },
  { assunto: "Crase", detalhe: "Língua Portuguesa · 4ª revisão" },
  { assunto: "Crimes contra a administração pública", detalhe: "Direito Penal · 3ª revisão", feita: true },
];

const SEMANA = [10, 15, 5, 20, 10, 20, 3];

export default function Inicio() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE_NOME,
      url: SITE_URL,
      description: SITE_DESCRICAO,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PERGUNTAS.map((p) => ({
        "@type": "Question",
        name: p.pergunta,
        acceptedAnswer: { "@type": "Answer", text: p.resposta },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <header className={styles.menu}>
        <div className={styles.menuDentro}>
          <Link href="/" aria-label="Concurso Plus, início">
            <Logo />
          </Link>
          <nav className={styles.links} aria-label="Seções">
            <a href="#como-funciona">Como funciona</a>
            <a href="#recursos">Recursos</a>
            <a href="#perguntas">Perguntas</a>
          </nav>
          <div className={styles.acoesMenu}>
            <Link href="/login" className={`botao ${styles.entrar}`}>
              Entrar
            </Link>
            <Link href="/cadastro" className={`botao botao-primario ${styles.criarMenu}`}>
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero} id="inicio">
          <span className={styles.selo}>
            <AlarmClock size={14} />
            Revisão espaçada para concursos públicos
          </span>
          <h1 className={styles.heroTitulo}>
            Estude uma vez.
            <br />
            Revise no tempo certo.
          </h1>
          <p className={styles.heroTexto}>
            Cadastre o que você estudou e o Concurso Plus agenda as revisões de 1, 3, 7 e 15 dias.{" "}
            <br />
            Todo dia, você só abre o site e revisa o que está na lista.
          </p>
          <div className={styles.heroBotoes}>
            <Link href="/cadastro" className="botao botao-primario botao-grande">
              Criar conta grátis <ArrowRight size={18} />
            </Link>
            <a href="#como-funciona" className="botao botao-secundario botao-grande">
              Ver como funciona
            </a>
          </div>
          <p className="legenda secundario">Grátis · Funciona no computador e no celular</p>
        </section>

        <div className={styles.previaFundo} aria-hidden="true">
          <div className={styles.previa}>
            <div className={styles.previaBarra}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.previaCorpo}>
              <div className={styles.previaTopo}>
                <div>
                  <p className="corpo secundario">Sábado, 17 de outubro</p>
                  <p className="titulo1">Boa noite, Mariana</p>
                </div>
                <span className="botao botao-primario">
                  <Plus size={18} /> Novo conteúdo
                </span>
              </div>
              <div className={`cartao ${styles.previaResumo}`}>
                <div>
                  <p className="legenda secundario">Revisões de hoje</p>
                  <p className="titulo1">1 de 4</p>
                  <span className={styles.barra}>
                    <span style={{ width: "25%" }} />
                  </span>
                </div>
                <div>
                  <p className="legenda secundario">Atrasadas</p>
                  <p className={`titulo1 ${styles.vermelho}`}>1</p>
                  <p className="legenda secundario">Aparece no topo da lista</p>
                </div>
                <div>
                  <p className="legenda secundario">Tempo de revisão</p>
                  <p className="titulo1">2h de 2h</p>
                  <span className={`${styles.barra} ${styles.barraCheia}`}>
                    <span style={{ width: "100%" }} />
                  </span>
                </div>
                <div>
                  <p className="legenda secundario">Esta semana</p>
                  <p className="titulo1">9 revisões</p>
                  <span className={styles.semana}>
                    {SEMANA.map((h, i) => (
                      <span key={i} style={{ height: h }} className={i === 6 ? styles.semanaHoje : undefined} />
                    ))}
                  </span>
                </div>
              </div>
              <p className={styles.previaTitulo}>
                <span className="titulo2">Para revisar hoje</span>
                <span className="corpo secundario">3 pendentes</span>
              </p>
              <ul className={`cartao ${styles.previaLista}`}>
                {PREVIA.map((r) => (
                  <li key={r.assunto} className={r.feita ? styles.feita : undefined}>
                    <span
                      className={`${styles.caixa} ${r.atrasada ? styles.caixaAtrasada : ""} ${r.feita ? styles.caixaFeita : ""}`}
                    >
                      {r.feita && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span className={styles.previaTexto}>
                      <span className="corpo-forte">{r.assunto}</span>
                      <span className="legenda secundario">{r.detalhe}</span>
                    </span>
                    {r.atrasada && <span className={styles.aviso}>Atrasada há 1 dia</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <section className={styles.secao} id="como-funciona">
          <div className={styles.cabecalho}>
            <p className={styles.sobretitulo}>Como funciona</p>
            <h2 className={styles.secaoTitulo}>Três passos, todos os dias</h2>
          </div>
          <ol className={styles.passos}>
            {PASSOS.map((p, i) => (
              <li key={p.titulo} className="cartao">
                <span className={styles.numero}>{i + 1}</span>
                <h3 className="titulo3">{p.titulo}</h3>
                <p className="corpo secundario">{p.texto}</p>
              </li>
            ))}
          </ol>
          <div className={`cartao ${styles.linhaTempo}`}>
            <p className="corpo-forte">Exemplo: estudou Crase no dia 17/10</p>
            <ol className={styles.pontosTempo}>
              {LINHA_DO_TEMPO.map((p, i) => (
                <li key={p.data}>
                  <span className={i === 0 ? styles.marcaFeita : styles.marca}>
                    {p.marca ?? <Check size={18} strokeWidth={3} />}
                  </span>
                  <span className="corpo-forte">{p.data}</span>
                  <span className="legenda secundario">{p.quando}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.secao} id="recursos">
          <div className={styles.cabecalho}>
            <p className={styles.sobretitulo}>Recursos</p>
            <h2 className={styles.secaoTitulo}>Feito para quem estuda para concurso</h2>
          </div>
          <ul className={styles.recursos}>
            {RECURSOS.map(({ icone: Icone, titulo, texto }) => (
              <li key={titulo}>
                <span className={styles.recursoIcone}>
                  <Icone size={20} />
                </span>
                <h3 className="titulo3">{titulo}</h3>
                <p className="corpo secundario">{texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${styles.secao} ${styles.secaoEstreita}`} id="perguntas">
          <h2 className={styles.secaoTitulo}>Perguntas frequentes</h2>
          <div className={`cartao ${styles.perguntas}`}>
            {PERGUNTAS.map((p, i) => (
              <details key={p.pergunta} open={i === 0}>
                <summary>
                  <span className="corpo-forte">{p.pergunta}</span>
                  <ChevronDown size={18} className={styles.seta} />
                </summary>
                <p className="corpo secundario">{p.resposta}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.secao}>
          <div className={styles.chamada}>
            <h2 className={styles.secaoTitulo}>Comece hoje a revisar no tempo certo</h2>
            <p className="titulo3">Leva um minuto para criar a conta.</p>
            <Link href="/cadastro" className={`botao botao-grande ${styles.botaoEscuro}`}>
              Criar conta grátis <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.rodape}>
        <Logo tamanho={28} />
        <p className="legenda secundario">© 2026 Concurso Plus · Feito para estudar melhor</p>
      </footer>
    </>
  );
}
