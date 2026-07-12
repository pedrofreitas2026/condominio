"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  // Get the latest financial statement
  const latestPrestacao = await prisma.prestacaoContas.findFirst({
    where: { condominioId: 1 },
    orderBy: { mesReferencia: "desc" },
  });

  // Get the latest billing (kept primarily for reference and delinquencies)
  const latestCobranca = await prisma.cobrancaMensal.findFirst({
    where: { condominioId: 1 },
    orderBy: { mesReferencia: "desc" },
  });

  // Get all delinquencies
  const inadimplentes = await prisma.cobrancaItem.findMany({
    where: {
      statusPagamento: { in: ["pendente", "pago_parcial"] },
    },
  });

  // Alterado: Total previsto agora é igual ao total recebido (ambos baseados nas receitas da prestação)
  const totalRecebido = latestPrestacao?.totalReceitas ?? 0;
  const totalPrevisto = totalRecebido;
  const totalDespesas = latestPrestacao?.totalDespesas ?? 0;

  // Cálculo dinâmico baseado na prestação de contas (Receitas - Despesas)
  const creditoMes = Number(totalRecebido) - Number(totalDespesas);

  // O parâmetro foi definido como 'i', então dentro deve ser 'i'
  const totalEmAtraso = inadimplentes.reduce(
    (sum, i) => sum + (Number(i.totalAPagar) - Number(i.valorPago)),
    0
  );

  return {
    mesAtual: latestPrestacao?.mesReferencia ?? latestCobranca?.mesReferencia ?? null,
    totalPrevisto,
    totalRecebido,
    totalEmAtraso,
    totalDespesas,
    creditoMes,
    saldoReservaGas: latestPrestacao?.saldoReservaGas ?? 0,
    saldoContaCorrente: latestPrestacao?.saldoContaCorrente ?? 0,
    saldoPoupanca: latestPrestacao?.saldoPoupanca ?? 0,
    qtdInadimplentes: inadimplentes.length,
    totalCobrancas: await prisma.cobrancaMensal.count({ where: { condominioId: 1 } }),
  };
}