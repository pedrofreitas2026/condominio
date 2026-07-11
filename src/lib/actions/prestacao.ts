"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPrestacoes() {
  return prisma.prestacaoContas.findMany({
    where: { condominioId: 1 },
    include: {
      receitas: true,
      despesas: true,
    },
    orderBy: { mesReferencia: "desc" },
  });
}

export async function getPrestacao(id: number) {
  return prisma.prestacaoContas.findUnique({
    where: { id },
    include: {
      condominio: true,
      receitas: { orderBy: { createdAt: "asc" } },
      despesas: { orderBy: { createdAt: "asc" } },
      movimentacoes: { orderBy: { createdAt: "asc" } },
      atrasos: { orderBy: { createdAt: "asc" } },
      creditos: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function createPrestacao(formData: FormData) {
  const mesReferencia = formData.get("mesReferencia") as string;
  const saldoMesAnterior = parseFloat(formData.get("saldoMesAnterior") as string) || 0;
  const saldoReservaGas = parseFloat(formData.get("saldoReservaGas") as string) || 0;
  const saldoContaCorrente = parseFloat(formData.get("saldoContaCorrente") as string) || 0;
  const saldoPoupanca = parseFloat(formData.get("saldoPoupanca") as string) || 0;

  // Auto-import billing totals as revenue
  const cobranca = await prisma.cobrancaMensal.findUnique({
    where: { condominioId_mesReferencia: { condominioId: 1, mesReferencia } },
    include: { itens: true },
  });

  const receitas: { descricao: string; valor: number; origem: string }[] = [];

  if (cobranca) {
    const totalTaxas = cobranca.itens.reduce((sum, i) => sum + i.taxaCondominio, 0);
    const totalExtras = cobranca.itens.reduce((sum, i) => sum + i.taxaExtra, 0);
    const totalGas = cobranca.itens.reduce((sum, i) => sum + i.valorGas, 0);

    if (totalTaxas > 0) {
      receitas.push({ descricao: "Taxa de condomínio", valor: totalTaxas, origem: "cobranca" });
    }
    if (totalExtras > 0) {
      receitas.push({ descricao: "Taxa extra", valor: totalExtras, origem: "cobranca" });
    }
    if (totalGas > 0) {
      receitas.push({ descricao: "Gás", valor: totalGas, origem: "cobranca" });
    }
  }

  const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0);

  const prestacao = await prisma.prestacaoContas.create({
    data: {
      condominioId: 1,
      mesReferencia,
      saldoMesAnterior,
      totalReceitas,
      totalDespesas: 0,
      creditoMes: totalReceitas,
      saldoReservaGas,
      saldoContaCorrente,
      saldoPoupanca,
      receitas: {
        create: receitas,
      },
    },
  });

  revalidatePath("/prestacao", "layout");
  return prestacao.id;
}

async function recalcularPrestacao(prestacaoId: number) {
  const prestacao = await prisma.prestacaoContas.findUnique({
    where: { id: prestacaoId },
    include: { receitas: true, despesas: true, atrasos: true, creditos: true },
  });

  if (!prestacao) return;

  const totalReceitas = prestacao.receitas.reduce((sum, r) => sum + r.valor, 0);
  const totalDespesas = prestacao.despesas.reduce((sum, d) => sum + d.valor, 0);
  const totalAtrasos = prestacao.atrasos.reduce((sum, a) => sum + a.valor, 0);
  const totalCreditos = prestacao.creditos.reduce((sum, c) => sum + c.valor, 0);
  const creditoMes = prestacao.saldoMesAnterior + totalReceitas - totalDespesas - totalAtrasos + totalCreditos;

  await prisma.prestacaoContas.update({
    where: { id: prestacaoId },
    data: { totalReceitas, totalDespesas, totalAtrasos, creditoMes },
  });
}

export async function addReceita(prestacaoId: number, formData: FormData) {
  const descricao = formData.get("descricao") as string;
  const valor = parseFloat(formData.get("valor") as string);

  await prisma.receita.create({
    data: {
      prestacaoContasId: prestacaoId,
      descricao,
      valor,
      origem: "manual",
    },
  });

  await recalcularPrestacao(prestacaoId);
  revalidatePath("/prestacao", "layout");
}

export async function addDespesa(prestacaoId: number, formData: FormData) {
  const descricao = formData.get("descricao") as string;
  const valor = parseFloat(formData.get("valor") as string);
  const categoria = (formData.get("categoria") as string) || null;
  const dataPagamento = (formData.get("dataPagamento") as string) || null;

  await prisma.despesa.create({
    data: {
      prestacaoContasId: prestacaoId,
      descricao,
      valor,
      categoria,
      dataPagamento,
    },
  });

  await recalcularPrestacao(prestacaoId);
  revalidatePath("/prestacao", "layout");
}

export async function deleteReceita(id: number, prestacaoId: number) {
  await prisma.receita.delete({ where: { id } });
  await recalcularPrestacao(prestacaoId);
  revalidatePath("/prestacao", "layout");
}

export async function deleteDespesa(id: number, prestacaoId: number) {
  await prisma.despesa.delete({ where: { id } });
  await recalcularPrestacao(prestacaoId);
  revalidatePath("/prestacao", "layout");
}

export async function updateReceita(id: number, prestacaoId: number, formData: FormData) {
  const descricao = formData.get("descricao") as string;
  const valor = parseFloat(formData.get("valor") as string);

  await prisma.receita.update({
    where: { id },
    data: { descricao, valor },
  });

  await recalcularPrestacao(prestacaoId);
  revalidatePath("/prestacao", "layout");
}

export async function updateDespesa(id: number, prestacaoId: number, formData: FormData) {
  const descricao = formData.get("descricao") as string;
  const valor = parseFloat(formData.get("valor") as string);
  const categoria = (formData.get("categoria") as string) || null;
  const dataPagamento = (formData.get("dataPagamento") as string) || null;

  await prisma.despesa.update({
    where: { id },
    data: { descricao, valor, categoria, dataPagamento },
  });

  await recalcularPrestacao(prestacaoId);
  revalidatePath("/prestacao", "layout");
}

export async function addMovimentacao(prestacaoId: number, formData: FormData) {
  const conta = formData.get("conta") as string;
  const descricao = formData.get("descricao") as string;
  const valor = parseFloat(formData.get("valor") as string);
  const tipo = formData.get("tipo") as string;

  await prisma.movimentacaoFinanceira.create({
    data: {
      prestacaoContasId: prestacaoId,
      conta,
      descricao,
      valor,
      tipo,
    },
  });

  // Update balances based on account type
  const prestacao = await prisma.prestacaoContas.findUnique({ where: { id: prestacaoId } });
  if (!prestacao) return;

  const ajuste = tipo === "entrada" ? valor : -valor;

  if (conta === "reserva_gas") {
    await prisma.prestacaoContas.update({
      where: { id: prestacaoId },
      data: { saldoReservaGas: prestacao.saldoReservaGas + ajuste },
    });
  } else if (conta === "conta_corrente") {
    await prisma.prestacaoContas.update({
      where: { id: prestacaoId },
      data: { saldoContaCorrente: prestacao.saldoContaCorrente + ajuste },
    });
  } else if (conta === "poupanca") {
    await prisma.prestacaoContas.update({
      where: { id: prestacaoId },
      data: { saldoPoupanca: prestacao.saldoPoupanca + ajuste },
    });
  }

  revalidatePath("/prestacao", "layout");
}

export async function updateSaldos(prestacaoId: number, formData: FormData) {
  const saldoReservaGas = parseFloat(formData.get("saldoReservaGas") as string) || 0;
  const saldoContaCorrente = parseFloat(formData.get("saldoContaCorrente") as string) || 0;
  const saldoPoupanca = parseFloat(formData.get("saldoPoupanca") as string) || 0;

  await prisma.prestacaoContas.update({
    where: { id: prestacaoId },
    data: { saldoReservaGas, saldoContaCorrente, saldoPoupanca },
  });

  revalidatePath("/prestacao", "layout");
}

export async function deleteMovimentacao(id: number, prestacaoId: number) {
  const mov = await prisma.movimentacaoFinanceira.findUnique({ where: { id } });
  if (!mov) return;

  const prestacao = await prisma.prestacaoContas.findUnique({ where: { id: prestacaoId } });
  if (!prestacao) return;

  let newSaldoReservaGas = prestacao.saldoReservaGas;
  let newSaldoContaCorrente = prestacao.saldoContaCorrente;
  let newSaldoPoupanca = prestacao.saldoPoupanca;

  // Revert its effect on balances
  const revertAjuste = mov.tipo === "entrada" ? -mov.valor : mov.valor;
  if (mov.conta === "reserva_gas") {
    newSaldoReservaGas += revertAjuste;
  } else if (mov.conta === "conta_corrente") {
    newSaldoContaCorrente += revertAjuste;
  } else if (mov.conta === "poupanca") {
    newSaldoPoupanca += revertAjuste;
  }

  await prisma.$transaction([
    prisma.prestacaoContas.update({
      where: { id: prestacaoId },
      data: {
        saldoReservaGas: newSaldoReservaGas,
        saldoContaCorrente: newSaldoContaCorrente,
        saldoPoupanca: newSaldoPoupanca,
      },
    }),
    prisma.movimentacaoFinanceira.delete({ where: { id } }),
  ]);

  revalidatePath("/prestacao", "layout");
}

export async function updateMovimentacao(id: number, prestacaoId: number, formData: FormData) {
  const conta = formData.get("conta") as string;
  const descricao = formData.get("descricao") as string;
  const valor = parseFloat(formData.get("valor") as string);
  const tipo = formData.get("tipo") as string;

  const oldMov = await prisma.movimentacaoFinanceira.findUnique({ where: { id } });
  if (!oldMov) return;

  const prestacao = await prisma.prestacaoContas.findUnique({ where: { id: prestacaoId } });
  if (!prestacao) return;

  // Compute the new balances
  let newSaldoReservaGas = prestacao.saldoReservaGas;
  let newSaldoContaCorrente = prestacao.saldoContaCorrente;
  let newSaldoPoupanca = prestacao.saldoPoupanca;

  // 1. Revert old movimentacao
  const revertAjuste = oldMov.tipo === "entrada" ? -oldMov.valor : oldMov.valor;
  if (oldMov.conta === "reserva_gas") {
    newSaldoReservaGas += revertAjuste;
  } else if (oldMov.conta === "conta_corrente") {
    newSaldoContaCorrente += revertAjuste;
  } else if (oldMov.conta === "poupanca") {
    newSaldoPoupanca += revertAjuste;
  }

  // 2. Apply new movimentacao
  const applyAjuste = tipo === "entrada" ? valor : -valor;
  if (conta === "reserva_gas") {
    newSaldoReservaGas += applyAjuste;
  } else if (conta === "conta_corrente") {
    newSaldoContaCorrente += applyAjuste;
  } else if (conta === "poupanca") {
    newSaldoPoupanca += applyAjuste;
  }

  // 3. Perform the database update in a transaction
  await prisma.$transaction([
    prisma.prestacaoContas.update({
      where: { id: prestacaoId },
      data: {
        saldoReservaGas: newSaldoReservaGas,
        saldoContaCorrente: newSaldoContaCorrente,
        saldoPoupanca: newSaldoPoupanca,
      },
    }),
    prisma.movimentacaoFinanceira.update({
      where: { id },
      data: { conta, descricao, valor, tipo },
    }),
  ]);

  revalidatePath("/prestacao", "layout");
}

export async function deletePrestacao(id: number) {
  await prisma.prestacaoContas.delete({ where: { id } });
  revalidatePath("/prestacao", "layout");
}

export async function addAtraso(prestacaoId: number, formData: FormData) {
  const mesReferencia = formData.get("mesReferencia") as string;
  const valor = parseFloat(formData.get("valor") as string);

  await prisma.atraso.create({
    data: {
      prestacaoContasId: prestacaoId,
      mesReferencia,
      valor,
    },
  });

  await recalcularPrestacao(prestacaoId);
  revalidatePath("/prestacao", "layout");
}

export async function updateAtraso(id: number, prestacaoId: number, formData: FormData) {
  const mesReferencia = formData.get("mesReferencia") as string;
  const valor = parseFloat(formData.get("valor") as string);

  await prisma.atraso.update({
    where: { id },
    data: { mesReferencia, valor },
  });

  await recalcularPrestacao(prestacaoId);
  revalidatePath("/prestacao", "layout");
}

export async function deleteAtraso(id: number, prestacaoId: number) {
  await prisma.atraso.delete({ where: { id } });
  await recalcularPrestacao(prestacaoId);
  revalidatePath("/prestacao", "layout");
}

export async function addCredito(prestacaoId: number, formData: FormData) {
  const descricao = formData.get("descricao") as string;
  const valor = parseFloat(formData.get("valor") as string);

  await prisma.credito.create({
    data: {
      prestacaoContasId: prestacaoId,
      descricao,
      valor,
    },
  });

  await recalcularPrestacao(prestacaoId);
  revalidatePath("/prestacao", "layout");
}

export async function updateCredito(id: number, prestacaoId: number, formData: FormData) {
  const descricao = formData.get("descricao") as string;
  const valor = parseFloat(formData.get("valor") as string);

  await prisma.credito.update({
    where: { id },
    data: { descricao, valor },
  });

  await recalcularPrestacao(prestacaoId);
  revalidatePath("/prestacao", "layout");
}

export async function deleteCredito(id: number, prestacaoId: number) {
  await prisma.credito.delete({ where: { id } });
  await recalcularPrestacao(prestacaoId);
  revalidatePath("/prestacao", "layout");
}


