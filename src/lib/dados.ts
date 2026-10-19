import "server-only";
import { criarClienteServidor } from "./supabase/server";
import { CONFIG_PADRAO, type Config, type Conteudo, type Disciplina, type Revisao, type Tema } from "./revisoes";

export type Dados = {
  usuario: { email: string; nome: string; comGoogle: boolean };
  config: Config;
  disciplinas: Disciplina[];
  conteudos: Conteudo[];
};

export type Supabase = Awaited<ReturnType<typeof criarClienteServidor>>;

/** O Supabase devolve no máximo 1000 linhas por vez; busca em páginas até acabar. */
export async function todasAsRevisoes(supabase: Supabase): Promise<{ data: Revisao[]; error: { message: string } | null }> {
  const tamanho = 1000;
  const data: Revisao[] = [];
  for (let de = 0; ; de += tamanho) {
    const { data: pagina, error } = await supabase
      .from("revisoes")
      .select("id, conteudo_id, numero, data_prevista, feita_em, achou_dificil")
      .order("id")
      .range(de, de + tamanho - 1);
    if (error) return { data, error };
    data.push(...((pagina ?? []) as Revisao[]));
    if (!pagina || pagina.length < tamanho) return { data, error: null };
  }
}

/** Carrega tudo o que a página principal precisa, só da pessoa logada (o banco garante isso). */
export async function carregarDados(): Promise<Dados | null> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [perfil, disciplinas, conteudos, revisoes] = await Promise.all([
    supabase.from("perfis").select("nome, horas_estudo_dia, minutos_por_revisao, tema").eq("id", user.id).maybeSingle(),
    supabase.from("disciplinas").select("id, nome").order("nome"),
    supabase
      .from("conteudos")
      .select("id, disciplina_id, assunto, data_estudo, anotacoes, status, criado_em")
      .order("criado_em", { ascending: false })
      .limit(5000),
    todasAsRevisoes(supabase),
  ]);

  const erro = perfil.error ?? disciplinas.error ?? conteudos.error ?? revisoes.error;
  if (erro) throw new Error(`Erro ao carregar os dados: ${erro.message}`);

  const porConteudo = new Map<string, Revisao[]>();
  for (const r of (revisoes.data ?? []) as Revisao[]) {
    const lista = porConteudo.get(r.conteudo_id) ?? [];
    lista.push(r);
    porConteudo.set(r.conteudo_id, lista);
  }

  const meta = user.user_metadata ?? {};
  const nome =
    perfil.data?.nome || meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "Estudante");

  return {
    usuario: {
      email: user.email ?? "",
      nome: String(nome),
      comGoogle: user.app_metadata?.provider === "google",
    },
    config: perfil.data
      ? {
          horas_estudo_dia: Number(perfil.data.horas_estudo_dia),
          minutos_por_revisao: perfil.data.minutos_por_revisao,
          tema: perfil.data.tema as Tema,
        }
      : CONFIG_PADRAO,
    disciplinas: (disciplinas.data ?? []) as Disciplina[],
    conteudos: ((conteudos.data ?? []) as Omit<Conteudo, "revisoes">[]).map((c) => ({
      ...c,
      revisoes: (porConteudo.get(c.id) ?? []).sort((a, b) => a.numero - b.numero),
    })),
  };
}
