"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getApartamentos() {
  return prisma.apartamento.findMany({
    where: { condominioId: 1 },
    orderBy: { numero: "asc" },
  });
}

export async function getApartamento(id: number) {
  return prisma.apartamento.findUnique({
    where: { id },
    include: {
      cobrancaItens: {
        include: { cobrancaMensal: true },
        orderBy: { cobrancaMensal: { mesReferencia: "desc" } },
      },
    },
  });
}

export async function createApartamento(formData: FormData) {
  const numero = formData.get("numero") as string;
  const morador = formData.get("morador") as string || null;
  const proprietario = formData.get("proprietario") as string || null;

  await prisma.apartamento.create({
    data: {
      condominioId: 1,
      numero,
      morador,
      proprietario,
      ativo: true,
    },
  });

  revalidatePath("/apartamentos");
}

export async function updateApartamento(id: number, formData: FormData) {
  const morador = formData.get("morador") as string || null;
  const proprietario = formData.get("proprietario") as string || null;
  const ativo = formData.get("ativo") === "true";

  await prisma.apartamento.update({
    where: { id },
    data: { morador, proprietario, ativo },
  });

  revalidatePath("/apartamentos");
}

export async function deleteApartamento(id: number) {
  await prisma.apartamento.update({
    where: { id },
    data: { ativo: false },
  });

  revalidatePath("/apartamentos");
}
