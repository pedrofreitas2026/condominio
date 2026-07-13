// @/app/relatorios/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import RelatoriosClient from "./RelatoriosClient";

const prisma = new PrismaClient();

interface DecodedToken {
  id: number;
  nome: string;
  role: "sindico" | "morador";
  apartamento?: string;
}

export default async function RelatoriosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let usuarioLogado: DecodedToken;

  try {
    usuarioLogado = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret-chave-temporaria-cond-2026"
    ) as DecodedToken;
  } catch (error) {
    redirect("/login");
  }

  // Busca as cobranças mensais incluindo os itens e os dados do apartamento vinculado
  const cobrancasRaw = await prisma.cobrancaMensal.findMany({
    include: {
      itens: {
        include: {
          apartamento: true,
        },
      },
    },
    orderBy: { mesReferencia: "desc" },
  });

  // Busca as prestações de contas incluindo receitas e despesas
  const prestacoesRaw = await prisma.prestacaoContas.findMany({
    include: {
      receitas: true,
      despesas: true,
    },
    orderBy: { mesReferencia: "desc" },
  });

  // Mapeia os dados do Prisma convertendo os valores do tipo Decimal para Number do TS
  const cobrancas = cobrancasRaw.map((c) => ({
    id: c.id,
    mesReferencia: c.mesReferencia,
    dataVencimento: c.dataVencimento.toISOString().split("T")[0],
    precoGasM3Padrao: Number(c.precoGasM3Padrao),
    totalGeral: c.itens.reduce((acc: number, i) => acc + Number(i.totalAPagar), 0),
    totalTaxas: c.itens.reduce((acc: number, i) => acc + Number(i.taxaCondominio), 0),
    totalExtras: c.itens.reduce((acc: number, i) => acc + Number(i.taxaExtra), 0),
    totalGas: c.itens.reduce((acc: number, i) => acc + Number(i.valorGas), 0),
    totalConsumoGas: c.itens.reduce((acc: number, i) => acc + Number(i.consumoGas), 0),
    itens: c.itens.map((i) => ({
      id: i.id,
      apartamento: { numero: i.apartamento.numero },
      taxaCondominio: Number(i.taxaCondominio),
      taxaExtra: Number(i.taxaExtra),
      leituraAnteriorGas: Number(i.leituraAnteriorGas),
      leituraAtualGas: Number(i.leituraAtualGas),
      consumoGas: Number(i.consumoGas),
      precoGasM3: Number(i.precoGasM3),
      valorGas: Number(i.valorGas),
      totalAPagar: Number(i.totalAPagar),
      valorPago: Number(i.valorPago),
      statusPagamento: i.statusPagamento.toUpperCase(),
    })),
  }));

  const prestacoes = prestacoesRaw.map((p) => ({
    id: p.id,
    mesReferencia: p.mesReferencia,
    totalReceitas: Number(p.totalReceitas),
    totalDespesas: Number(p.totalDespesas),
    creditoMes: Number(p.creditoMes),
    saldoReservaGas: Number(p.saldoReservaGas),
    saldoContaCorrente: Number(p.saldoContaCorrente),
    saldoPoupanca: Number(p.saldoPoupanca),
    receitas: p.receitas.map((r) => ({ id: r.id, descricao: r.descricao, valor: Number(r.valor) })),
    despesas: p.despesas.map((d) => ({ id: d.id, descricao: d.descricao, valor: Number(d.valor), categoria: d.categoria })),
  }));

  return (
    <RelatoriosClient
      cobrancas={cobrancas}
      prestacoes={prestacoes}
      usuarioLogado={usuarioLogado}
    />
  );
}