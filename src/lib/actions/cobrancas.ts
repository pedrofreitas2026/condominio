"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  calcConsumoGas,
  calcPrecoGas,
  calcValorGas,
  calcTotalAPagar,
} from "@/lib/utils";

export async function getCobrancas() {
  const cobrancas = await prisma.cobrancaMensal.findMany({
    where: { condominioId: 1 },
    include: {
      itens: {
        include: { apartamento: true },
      },
    },
    orderBy: { mesReferencia: "desc" },
  });

  return cobrancas.map((c) => ({
    ...c,
    totalGeral: c.itens.reduce((sum, item) => sum + item.totalAPagar, 0),
    totalPago: c.itens.reduce((sum, item) => sum + item.valorPago, 0),
    totalTaxas: c.itens.reduce((sum, item) => sum + item.taxaCondominio, 0),
    totalExtras: c.itens.reduce((sum, item) => sum + item.taxaExtra, 0),
    totalGas: c.itens.reduce((sum, item) => sum + item.valorGas, 0),
    totalConsumoGas: c.itens.reduce((sum, item) => sum + item.consumoGas, 0),
  }));
}

export async function getCobranca(id: number) {
  const cobranca = await prisma.cobrancaMensal.findUnique({
    where: { id },
    include: {
      condominio: true,
      itens: {
        include: { apartamento: true },
        orderBy: { apartamento: { numero: "asc" } },
      },
    },
  });

  if (!cobranca) return null;

  return {
    ...cobranca,
    totalGeral: cobranca.itens.reduce((sum, item) => sum + item.totalAPagar, 0),
    totalPago: cobranca.itens.reduce((sum, item) => sum + item.valorPago, 0),
    totalTaxas: cobranca.itens.reduce((sum, item) => sum + item.taxaCondominio, 0),
    totalExtras: cobranca.itens.reduce((sum, item) => sum + item.taxaExtra, 0),
    totalGas: cobranca.itens.reduce((sum, item) => sum + item.valorGas, 0),
    totalConsumoGas: cobranca.itens.reduce((sum, item) => sum + item.consumoGas, 0),
  };
}

export async function createCobranca(formData: FormData) {
  const mesReferencia = formData.get("mesReferencia") as string;
  const dataVencimento = formData.get("dataVencimento") as string;
  const taxaCondominioPadrao = parseFloat(formData.get("taxaCondominioPadrao") as string);
  const taxaExtraPadrao = parseFloat(formData.get("taxaExtraPadrao") as string) || 0;
  const precoGasM3Padrao = parseFloat(formData.get("precoGasM3Padrao") as string);
  const observacoes = formData.get("observacoes") as string || null;
  const copiarAnterior = formData.get("copiarAnterior") === "true";

  // Get active apartments
  const apartamentos = await prisma.apartamento.findMany({
    where: { condominioId: 1, ativo: true },
    orderBy: { numero: "asc" },
  });

  // Get previous month's billing for gas readings
  let previousItens: Record<number, { leituraAtualGas: number }> = {};
  if (copiarAnterior) {
    // Busca a última cobrança anterior ao mês atual (não apenas o mês imediatamente anterior)
    const prevCobranca = await prisma.cobrancaMensal.findFirst({
      where: {
        condominioId: 1,
        mesReferencia: { lt: mesReferencia },
      },
      orderBy: { mesReferencia: "desc" },
      include: { itens: true },
    });
    if (prevCobranca) {
      for (const item of prevCobranca.itens) {
        previousItens[item.apartamentoId] = {
          leituraAtualGas: item.leituraAtualGas,
        };
      }
    }
  }

  const cobranca = await prisma.cobrancaMensal.create({
    data: {
      condominioId: 1,
      mesReferencia,
      dataVencimento,
      taxaCondominioPadrao,
      taxaExtraPadrao,
      precoGasM3Padrao,
      observacoes,
      itens: {
        create: apartamentos.map((apto) => {
          const leituraAnterior = previousItens[apto.id]?.leituraAtualGas ?? 0;
          return {
            apartamentoId: apto.id,
            taxaCondominio: taxaCondominioPadrao,
            taxaExtra: taxaExtraPadrao,
            leituraAnteriorGas: leituraAnterior,
            leituraAtualGas: 0,
            consumoGas: 0,
            precoGasM3: 0,
            valorGas: 0,
            totalAPagar: taxaCondominioPadrao + taxaExtraPadrao,
          };
        }),
      },
    },
  });

  revalidatePath("/cobrancas", "layout");
  return cobranca.id;
}

export async function updateCobrancaItem(
  itemId: number,
  data: {
    leituraAtualGas?: number;
    taxaCondominio?: number;
    taxaExtra?: number;
    statusPagamento?: string;
    valorPago?: number;
    dataPagamento?: string;
  }
) {
  const item = await prisma.cobrancaItem.findUnique({
    where: { id: itemId },
    include: { cobrancaMensal: true },
  });

  if (!item) throw new Error("Item não encontrado");

  const leituraAtual = data.leituraAtualGas ?? item.leituraAtualGas;
  const taxaCondominio = data.taxaCondominio ?? item.taxaCondominio;
  const taxaExtra = data.taxaExtra ?? item.taxaExtra;

  const consumo = calcConsumoGas(item.leituraAnteriorGas, leituraAtual);
  const precoGas = calcPrecoGas(consumo, item.cobrancaMensal.precoGasM3Padrao);
  const valorGas = calcValorGas(consumo, precoGas);
  const total = calcTotalAPagar(taxaCondominio, taxaExtra, valorGas);

  await prisma.cobrancaItem.update({
    where: { id: itemId },
    data: {
      leituraAtualGas: leituraAtual,
      taxaCondominio,
      taxaExtra,
      consumoGas: consumo,
      precoGasM3: precoGas,
      valorGas,
      totalAPagar: total,
      statusPagamento: data.statusPagamento ?? item.statusPagamento,
      valorPago: data.valorPago ?? item.valorPago,
      dataPagamento: data.dataPagamento ?? item.dataPagamento,
    },
  });

  revalidatePath("/cobrancas", "layout");
}

export async function marcarPago(itemId: number, valorPago: number, dataPagamento: string) {
  const item = await prisma.cobrancaItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Item não encontrado");

  const status =
    valorPago >= item.totalAPagar
      ? "pago"
      : valorPago > 0
      ? "pago_parcial"
      : "pendente";

  await prisma.cobrancaItem.update({
    where: { id: itemId },
    data: {
      valorPago,
      dataPagamento,
      statusPagamento: status,
    },
  });

  revalidatePath("/cobrancas", "layout");
  revalidatePath("/inadimplencia", "layout");
}

export async function updateDataVencimento(cobrancaId: number, dataVencimento: string) {
  await prisma.cobrancaMensal.update({
    where: { id: cobrancaId },
    data: { dataVencimento },
  });

  revalidatePath("/cobrancas", "layout");
}

export async function deleteCobranca(id: number) {
  await prisma.cobrancaMensal.delete({ where: { id } });
  revalidatePath("/cobrancas", "layout");
}
