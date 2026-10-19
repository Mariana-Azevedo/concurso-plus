// Endereço público do site, usado no Google e nos links compartilhados.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_NOME = "Concurso Plus";
export const SITE_DESCRICAO =
  "Revisão espaçada para concursos públicos. Cadastre o que você estudou e o Concurso Plus agenda as revisões de 1, 3, 7 e 15 dias. Grátis, no computador e no celular.";
