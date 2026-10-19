// Chaves públicas do Supabase (vêm do arquivo .env.local ou das variáveis da Vercel)
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_CHAVE =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigurado = Boolean(SUPABASE_URL && SUPABASE_CHAVE);
