"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";

export type EstadoForm = { erro?: string; aviso?: string };

const FALTA_CONFIG = "O site ainda não está ligado ao Supabase. Veja o LEIAME do projeto.";

async function origem() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Só aceita voltar para páginas do próprio site. */
function destinoSeguro(valor: FormDataEntryValue | null): string {
  const s = typeof valor === "string" ? valor : "";
  return s.startsWith("/app") ? s : "/app";
}

function traduzirErro(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Já existe uma conta com este e-mail. Tente entrar.";
  if (m.includes("password should be")) return "A senha precisa ter pelo menos 8 caracteres.";
  if (m.includes("rate limit")) return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  if (m.includes("same password")) return "A nova senha precisa ser diferente da atual.";
  return "Não foi possível concluir agora. Tente de novo em instantes.";
}

export async function entrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  if (!supabaseConfigurado) return { erro: FALTA_CONFIG };
  const email = String(form.get("email") ?? "").trim();
  const senha = String(form.get("senha") ?? "");
  if (!email || !senha) return { erro: "Preencha o e-mail e a senha." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: traduzirErro(error.message) };
  redirect(destinoSeguro(form.get("voltar")));
}

export async function cadastrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  if (!supabaseConfigurado) return { erro: FALTA_CONFIG };
  const nome = String(form.get("nome") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const senha = String(form.get("senha") ?? "");
  if (!nome || !email || !senha) return { erro: "Preencha nome, e-mail e senha." };
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { full_name: nome },
      emailRedirectTo: `${await origem()}/auth/callback?next=/app`,
    },
  });
  if (error) return { erro: traduzirErro(error.message) };
  if (data.session) redirect("/app");
  return { aviso: `Quase lá! Enviamos um link para ${email}. Abra o e-mail para confirmar a conta.` };
}

export async function entrarComGoogle(form: FormData) {
  if (!supabaseConfigurado) redirect("/login?erro=config");
  const supabase = await criarClienteServidor();
  const next = destinoSeguro(form.get("voltar"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origem()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?erro=google");
  redirect(data.url);
}

export async function pedirNovaSenha(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  if (!supabaseConfigurado) return { erro: FALTA_CONFIG };
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { erro: "Informe seu e-mail." };
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origem()}/auth/callback?next=/redefinir-senha`,
  });
  if (error) return { erro: traduzirErro(error.message) };
  return { aviso: "Se existir uma conta com este e-mail, você vai receber um link para criar uma nova senha." };
}

export async function salvarNovaSenha(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  if (!supabaseConfigurado) return { erro: FALTA_CONFIG };
  const senha = String(form.get("senha") ?? "");
  const confirmar = String(form.get("confirmar") ?? "");
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  if (senha !== confirmar) return { erro: "As duas senhas não são iguais." };
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: traduzirErro(error.message) };
  redirect("/app");
}

export async function sair() {
  if (supabaseConfigurado) {
    const supabase = await criarClienteServidor();
    await supabase.auth.signOut();
  }
  redirect("/");
}
