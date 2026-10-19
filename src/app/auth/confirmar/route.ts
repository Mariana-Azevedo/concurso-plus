import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

// Confirmação por link com token (usado se os modelos de e-mail do Supabase forem trocados para token_hash).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/app";
  const destino = next.startsWith("/app") || next === "/redefinir-senha" ? next : "/app";

  if (token_hash && type) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}${type === "recovery" ? "/redefinir-senha" : destino}`);
  }
  return NextResponse.redirect(`${origin}/login?erro=link`);
}
