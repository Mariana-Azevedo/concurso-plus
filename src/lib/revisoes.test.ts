import { describe, expect, it } from "vitest";
import { diasDoMes, hojeISO, somarDias } from "./datas";
import {
  cargaDoDia,
  datasRevisoes,
  limiteRevisoesDia,
  recalcularPendentes,
  revisoesDoDia,
  statusConteudo,
  textoAtraso,
  verificarLimite,
  type Conteudo,
  type Revisao,
} from "./revisoes";

let seq = 0;
function rev(numero: number, data_prevista: string, feita_em: string | null = null, conteudo_id = "c1"): Revisao {
  return { id: `r${++seq}`, conteudo_id, numero, data_prevista, feita_em, achou_dificil: null };
}

describe("datas", () => {
  it("calcula as revisões do exemplo do plano (17/10)", () => {
    expect(datasRevisoes("2026-10-17")).toEqual([
      "2026-10-17",
      "2026-10-18",
      "2026-10-20",
      "2026-10-24",
      "2026-11-01",
    ]);
  });

  it("vira o mês e o ano", () => {
    expect(datasRevisoes("2026-12-28")).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-31",
      "2027-01-04",
      "2027-01-12",
    ]);
  });

  it("passa por fevereiro de ano bissexto", () => {
    expect(somarDias("2028-02-27", 3)).toBe("2028-03-01");
  });

  it("usa o horário de Brasília para hoje", () => {
    // 02:00 UTC do dia 18 ainda é dia 17 em Brasília (UTC-3)
    expect(hojeISO(new Date("2026-10-18T02:00:00Z"))).toBe("2026-10-17");
    expect(hojeISO(new Date("2026-10-18T03:30:00Z"))).toBe("2026-10-18");
  });

  it("monta o mês com espaços antes do dia 1", () => {
    const dias = diasDoMes(2026, 9); // outubro de 2026 começa numa quinta
    expect(dias.slice(0, 5)).toEqual([null, null, null, null, "2026-10-01"]);
    expect(dias.filter(Boolean)).toHaveLength(31);
  });
});

describe("limite diário", () => {
  it("padrão de 4h e 30 min permite 4 revisões", () => {
    expect(limiteRevisoesDia({ horas_estudo_dia: 4, minutos_por_revisao: 30 })).toBe(4);
  });

  it("arredonda para baixo", () => {
    expect(limiteRevisoesDia({ horas_estudo_dia: 3, minutos_por_revisao: 40 })).toBe(2);
  });

  it("bloqueia quando algum dia futuro está cheio", () => {
    const hoje = "2026-10-17";
    const cheias = [1, 2, 3, 4].map((i) => rev(2, "2026-10-20", null, `c${i}`));
    const r = verificarLimite(cheias, datasRevisoes(hoje).slice(1), hoje, 4);
    expect(r).toEqual({ ok: false, dia: "2026-10-20", carga: 4, limite: 4 });
  });

  it("deixa cadastrar quando cabe", () => {
    const hoje = "2026-10-17";
    const tres = [1, 2, 3].map((i) => rev(2, "2026-10-20", null, `c${i}`));
    expect(verificarLimite(tres, datasRevisoes(hoje).slice(1), hoje, 4)).toEqual({ ok: true });
  });

  it("a 1ª revisão não conta na carga", () => {
    const hoje = "2026-10-17";
    const lista = [rev(1, hoje, hoje), rev(2, hoje)];
    expect(cargaDoDia(lista, hoje, hoje)).toBe(1);
  });

  it("atrasadas contam na carga de hoje", () => {
    const hoje = "2026-10-17";
    const lista = [rev(2, "2026-10-15"), rev(3, hoje)];
    expect(cargaDoDia(lista, hoje, hoje)).toBe(2);
  });

  it("revisões de data passada caem no dia de hoje", () => {
    const hoje = "2026-10-17";
    const lista = [1, 2, 3].map((i) => rev(2, hoje, null, `c${i}`));
    // Estudado há 10 dias: 2ª, 3ª e 4ª já venceram e contam hoje
    const r = verificarLimite(lista, datasRevisoes("2026-10-07").slice(1), hoje, 4);
    expect(r.ok).toBe(false);
  });
});

describe("lista do dia", () => {
  const hoje = "2026-10-17";
  const atrasada = rev(3, "2026-10-16");
  const deHoje = rev(2, hoje);
  const futura = rev(4, "2026-10-20");
  const todas = [atrasada, deHoje, futura];

  it("hoje inclui as atrasadas", () => {
    expect(revisoesDoDia(todas, hoje, hoje)).toEqual([atrasada, deHoje]);
  });

  it("a atrasada continua no dia original", () => {
    expect(revisoesDoDia(todas, "2026-10-16", hoje)).toEqual([atrasada]);
  });

  it("depois de feita, sai de hoje", () => {
    const feita = { ...atrasada, feita_em: hoje };
    expect(revisoesDoDia([feita, deHoje], hoje, hoje)).toEqual([deHoje]);
  });

  it("escreve o atraso", () => {
    expect(textoAtraso(atrasada, hoje)).toBe("Atrasada há 1 dia");
    expect(textoAtraso(rev(2, "2026-10-10"), hoje)).toBe("Atrasada há 7 dias");
  });
});

describe("editar a data de estudo", () => {
  it("recalcula só as pendentes", () => {
    const lista = [
      rev(1, "2026-10-10", "2026-10-10"),
      rev(2, "2026-10-11", "2026-10-11"),
      rev(3, "2026-10-13"),
      rev(4, "2026-10-17"),
      rev(5, "2026-10-25"),
    ];
    const novas = recalcularPendentes(lista, "2026-10-12");
    expect(novas.map((n) => n.data_prevista)).toEqual(["2026-10-15", "2026-10-19", "2026-10-27"]);
  });
});

describe("status do conteúdo", () => {
  const base: Conteudo = {
    id: "c1",
    disciplina_id: "d1",
    assunto: "Crase",
    data_estudo: "2026-10-10",
    anotacoes: null,
    status: "em_revisao",
    criado_em: "",
    revisoes: [],
  };
  it("atrasado tem prioridade sobre difícil", () => {
    const c = { ...base, revisoes: [{ ...rev(5, "2026-10-01", "2026-10-01"), achou_dificil: true }, rev(6, "2026-10-16")] };
    expect(statusConteudo(c, "2026-10-17")).toBe("atrasado");
    expect(statusConteudo(c, "2026-10-16")).toBe("dificil");
  });
  it("concluído", () => {
    expect(statusConteudo({ ...base, status: "concluido" }, "2026-10-17")).toBe("concluido");
  });
});
