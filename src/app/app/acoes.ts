"use server";

import { refresh } from "next/cache";
import { hojeISO, somarDias } from "@/lib/datas";
import { todasAsRevisoes } from "@/lib/dados";
import {
  DIAS_REVISAO_EXTRA,
  datasRevisoes,
  limiteRevisoesDia,
  perguntaDificil,
  recalcularPendentes,
  verificarLimite,
  type Tema,
} from "@/lib/revisoes";
import { criarClienteServidor } from "@/lib/supabase/server";

export type Resultado = { ok: true } | { ok: false; erro: string; diaCheio?: string };

const ERRO_GERAL = "Não foi possível salvar agora. Confira a internet e tente de novo.";
const DATA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

async function sessao() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre de novo.");
  return { supabase, usuarioId: user.id };
}

export type DadosConteudo = {
  id?: string;
  disciplina_id: string;
  assunto: string;
  data_estudo: string;
  anotacoes: string;
};

export async function salvarConteudo(d: DadosConteudo): Promise<Resultado> {
  const { supabase, usuarioId } = await sessao();
  const hoje = hojeISO();
  const assunto = d.assunto.trim();
  if (!assunto) return { ok: false, erro: "Escreva o assunto." };
  if (!d.disciplina_id) return { ok: false, erro: "Escolha a disciplina." };
  if (!DATA_VALIDA.test(d.data_estudo) || d.data_estudo > hoje)
    return { ok: false, erro: "A data de estudo precisa ser hoje ou um dia anterior." };
  const anotacoes = d.anotacoes.trim() || null;

  if (d.id) {
    const { data: atual, error } = await supabase
      .from("conteudos")
      .select("data_estudo")
      .eq("id", d.id)
      .single();
    if (error || !atual) return { ok: false, erro: "Conteúdo não encontrado." };

    const { error: e1 } = await supabase
      .from("conteudos")
      .update({ disciplina_id: d.disciplina_id, assunto, data_estudo: d.data_estudo, anotacoes })
      .eq("id", d.id);
    if (e1) return { ok: false, erro: ERRO_GERAL };

    if (atual.data_estudo !== d.data_estudo) {
      const { data: revs } = await supabase
        .from("revisoes")
        .select("id, conteudo_id, numero, data_prevista, feita_em, achou_dificil")
        .eq("conteudo_id", d.id);
      const novas = recalcularPendentes(revs ?? [], d.data_estudo);
      const resultados = await Promise.all(
        novas.map((n) => supabase.from("revisoes").update({ data_prevista: n.data_prevista }).eq("id", n.id)),
      );
      // A 1ª revisão acompanha a data de estudo
      await supabase
        .from("revisoes")
        .update({ data_prevista: d.data_estudo, feita_em: d.data_estudo })
        .eq("conteudo_id", d.id)
        .eq("numero", 1);
      if (resultados.some((r) => r.error)) return { ok: false, erro: ERRO_GERAL };
    }
    refresh();
    return { ok: true };
  }

  // Novo conteúdo: confere o limite diário antes de salvar
  const [{ data: perfil }, { data: todas, error: eTodas }] = await Promise.all([
    supabase.from("perfis").select("horas_estudo_dia, minutos_por_revisao").eq("id", usuarioId).maybeSingle(),
    todasAsRevisoes(supabase),
  ]);
  if (eTodas) return { ok: false, erro: ERRO_GERAL };
  const limite = limiteRevisoesDia({
    horas_estudo_dia: Number(perfil?.horas_estudo_dia ?? 4),
    minutos_por_revisao: perfil?.minutos_por_revisao ?? 30,
  });
  const datas = datasRevisoes(d.data_estudo);
  const checagem = verificarLimite(todas, datas.slice(1), hoje, limite);
  if (!checagem.ok) {
    return { ok: false, erro: "Um dos dias das revisões deste conteúdo já está cheio.", diaCheio: checagem.dia };
  }

  const { data: novo, error: e2 } = await supabase
    .from("conteudos")
    .insert({ usuario_id: usuarioId, disciplina_id: d.disciplina_id, assunto, data_estudo: d.data_estudo, anotacoes })
    .select("id")
    .single();
  if (e2 || !novo) return { ok: false, erro: ERRO_GERAL };

  const { error: e3 } = await supabase.from("revisoes").insert(
    datas.map((data, i) => ({
      usuario_id: usuarioId,
      conteudo_id: novo.id,
      numero: i + 1,
      data_prevista: data,
      feita_em: i === 0 ? d.data_estudo : null,
    })),
  );
  if (e3) {
    await supabase.from("conteudos").delete().eq("id", novo.id);
    return { ok: false, erro: ERRO_GERAL };
  }
  refresh();
  return { ok: true };
}

export async function excluirConteudo(id: string): Promise<Resultado> {
  const { supabase } = await sessao();
  const { error } = await supabase.from("conteudos").delete().eq("id", id);
  if (error) return { ok: false, erro: ERRO_GERAL };
  refresh();
  return { ok: true };
}

/** Marca ou desmarca uma revisão. Devolve se é preciso perguntar "ainda difícil?". */
export async function marcarRevisao(id: string, feita: boolean): Promise<Resultado & { perguntar?: boolean }> {
  const { supabase } = await sessao();
  const { data: r, error } = await supabase
    .from("revisoes")
    .select("id, conteudo_id, numero, data_prevista, feita_em, achou_dificil")
    .eq("id", id)
    .single();
  if (error || !r) return { ok: false, erro: "Revisão não encontrada." };
  if (r.numero === 1) return { ok: false, erro: "A 1ª revisão é feita no dia do estudo." };

  if (feita) {
    const { error: e } = await supabase.from("revisoes").update({ feita_em: hojeISO() }).eq("id", id);
    if (e) return { ok: false, erro: ERRO_GERAL };
    refresh();
    return { ok: true, perguntar: perguntaDificil(r) };
  }

  // Desmarcar: desfaz também a resposta "ainda difícil?" desta revisão
  const { error: e } = await supabase.from("revisoes").update({ feita_em: null, achou_dificil: null }).eq("id", id);
  if (e) return { ok: false, erro: ERRO_GERAL };
  if (perguntaDificil(r)) {
    await supabase
      .from("revisoes")
      .delete()
      .eq("conteudo_id", r.conteudo_id)
      .eq("numero", r.numero + 1)
      .is("feita_em", null);
    await supabase.from("conteudos").update({ status: "em_revisao" }).eq("id", r.conteudo_id);
  }
  refresh();
  return { ok: true };
}

/** Resposta da pergunta "Ainda acha este conteúdo difícil?" depois da 5ª revisão ou de uma extra. */
export async function responderDificil(revisaoId: string, dificil: boolean): Promise<Resultado> {
  const { supabase, usuarioId } = await sessao();
  const { data: r, error } = await supabase
    .from("revisoes")
    .select("id, conteudo_id, numero, feita_em")
    .eq("id", revisaoId)
    .single();
  if (error || !r) return { ok: false, erro: "Revisão não encontrada." };

  await supabase.from("revisoes").update({ achou_dificil: dificil }).eq("id", revisaoId);
  if (dificil) {
    const base = r.feita_em ?? hojeISO();
    const { error: e } = await supabase.from("revisoes").upsert(
      {
        usuario_id: usuarioId,
        conteudo_id: r.conteudo_id,
        numero: r.numero + 1,
        data_prevista: somarDias(base, DIAS_REVISAO_EXTRA),
        feita_em: null,
      },
      { onConflict: "conteudo_id,numero" },
    );
    if (e) return { ok: false, erro: ERRO_GERAL };
    await supabase.from("conteudos").update({ status: "em_revisao" }).eq("id", r.conteudo_id);
  } else {
    await supabase.from("conteudos").update({ status: "concluido" }).eq("id", r.conteudo_id);
  }
  refresh();
  return { ok: true };
}

export async function adicionarDisciplina(nome: string): Promise<Resultado & { id?: string }> {
  const { supabase, usuarioId } = await sessao();
  const limpo = nome.trim().replace(/\s+/g, " ");
  if (!limpo) return { ok: false, erro: "Escreva o nome da disciplina." };
  const { data, error } = await supabase
    .from("disciplinas")
    .insert({ usuario_id: usuarioId, nome: limpo })
    .select("id")
    .single();
  if (error) {
    return { ok: false, erro: error.code === "23505" ? "Essa disciplina já existe." : ERRO_GERAL };
  }
  refresh();
  return { ok: true, id: data.id };
}

export async function renomearDisciplina(id: string, nome: string): Promise<Resultado> {
  const { supabase } = await sessao();
  const limpo = nome.trim().replace(/\s+/g, " ");
  if (!limpo) return { ok: false, erro: "Escreva o nome da disciplina." };
  const { error } = await supabase.from("disciplinas").update({ nome: limpo }).eq("id", id);
  if (error) return { ok: false, erro: error.code === "23505" ? "Essa disciplina já existe." : ERRO_GERAL };
  refresh();
  return { ok: true };
}

export async function removerDisciplina(id: string): Promise<Resultado> {
  const { supabase } = await sessao();
  const { count } = await supabase
    .from("conteudos")
    .select("id", { count: "exact", head: true })
    .eq("disciplina_id", id);
  if (count) return { ok: false, erro: "Só dá para remover disciplinas sem conteúdos." };
  const { error } = await supabase.from("disciplinas").delete().eq("id", id);
  if (error) return { ok: false, erro: ERRO_GERAL };
  refresh();
  return { ok: true };
}

export async function salvarTempo(horas: number, minutos: number): Promise<Resultado> {
  const { supabase, usuarioId } = await sessao();
  if (!(horas > 0 && horas <= 24) || !(minutos >= 5 && minutos <= 240)) {
    return { ok: false, erro: "Use de 0,5 a 24 horas e de 5 a 240 minutos." };
  }
  const { error } = await supabase
    .from("perfis")
    .upsert({ id: usuarioId, horas_estudo_dia: horas, minutos_por_revisao: minutos });
  if (error) return { ok: false, erro: ERRO_GERAL };
  refresh();
  return { ok: true };
}

export async function salvarTema(tema: Tema): Promise<Resultado> {
  const { supabase, usuarioId } = await sessao();
  if (!["claro", "escuro", "automatico"].includes(tema)) return { ok: false, erro: "Tema inválido." };
  const { error } = await supabase.from("perfis").upsert({ id: usuarioId, tema });
  if (error) return { ok: false, erro: ERRO_GERAL };
  return { ok: true };
}
