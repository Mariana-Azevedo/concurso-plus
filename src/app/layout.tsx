import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SCRIPT_TEMA } from "@/lib/tema";
import { SITE_DESCRICAO, SITE_NOME, SITE_URL } from "@/lib/site";
import "./globals.css";

const jakarta = localFont({
  src: [
    { path: "../fonts/plus-jakarta-sans-latin-wght-normal.woff2", weight: "200 800", style: "normal" },
    { path: "../fonts/plus-jakarta-sans-latin-ext-wght-normal.woff2", weight: "200 800", style: "normal" },
  ],
  variable: "--fonte",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NOME}: revisão espaçada para concursos públicos`,
    template: `%s · ${SITE_NOME}`,
  },
  description: SITE_DESCRICAO,
  applicationName: SITE_NOME,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0e17" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
