"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface Inadimplente {
  itemId: number;
  apartamentoNumero: string;
  mesReferencia: string;
  totalAPagar: number;
  valorPago: number;
  valorEmAberto: number;
  statusPagamento: string;
}

export async function getInadimplencias(): Promise<Inadimplente[]> {
  const itens = await prisma.cobrancaItem.findMany({
    where: {
      statusPagamento: { in: ["pendente", "pago_parcial"] },
    },
    include: {
      apartamento: true,
      cobrancaMensal: true,
    },
    orderBy: [
      { cobrancaMensal: { mesReferencia: "asc" } },
      { apartamento: { numero: "asc" } },
    ],
  });

  return itens.map((item) => ({
    itemId: item.id,
    apartamentoNumero: item.apartamento.numero,
    mesReferencia: item.cobrancaMensal.mesReferencia,
    totalAPagar: Number(item.totalAPagar),
    valorPago: Number(item.valorPago),
    valorEmAberto: Number(item.totalAPagar) - Number(item.valorPago),
    statusPagamento: item.statusPagamento,
  }));
}

export async function registrarPagamentoInadimplencia(
  itemId: number,
  valorPago: number,
  dataPagamento: string
) {
  const item = await prisma.cobrancaItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Item não encontrado");

  const totalPago = Number(item.valorPago) + valorPago;
  const status =
    totalPago >= Number(item.totalAPagar)
      ? "pago"
      : totalPago > 0
        ? "pago_parcial"
        : "pendente";

  await prisma.cobrancaItem.update({
    where: { id: itemId },
    data: {
      valorPago: totalPago,
      statusPagamento: status,
      dataPagamento,
    },
  });

  revalidatePath("/inadimplencia");
  revalidatePath("/cobrancas");
}