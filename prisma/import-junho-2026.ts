import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dados da planilha Junho 2026
const dadosJunho2026 = [
  { numero: "101", taxaCondominio: 393, taxaExtra: 10, leituraAnterior: 1342, leituraAtual: 1343, consumo: 1, precoM3: 21.50 },
  { numero: "102", taxaCondominio: 393, taxaExtra: 10, leituraAnterior: 3265, leituraAtual: 3269, consumo: 4, precoM3: 21.50 },
  { numero: "103", taxaCondominio: 393, taxaExtra: 10, leituraAnterior: 0, leituraAtual: 0, consumo: 0, precoM3: 0 },
  { numero: "201", taxaCondominio: 393, taxaExtra: 10, leituraAnterior: 683, leituraAtual: 684, consumo: 1, precoM3: 21.50 },
  { numero: "202", taxaCondominio: 393, taxaExtra: 10, leituraAnterior: 1406, leituraAtual: 1407, consumo: 1, precoM3: 21.50 },
  { numero: "203", taxaCondominio: 393, taxaExtra: 10, leituraAnterior: 611, leituraAtual: 612, consumo: 1, precoM3: 21.50 },
  { numero: "301", taxaCondominio: 393, taxaExtra: 10, leituraAnterior: 1204, leituraAtual: 1206, consumo: 2, precoM3: 21.50 },
  { numero: "302", taxaCondominio: 393, taxaExtra: 10, leituraAnterior: 1703, leituraAtual: 1704, consumo: 1, precoM3: 21.50 },
  { numero: "303", taxaCondominio: 393, taxaExtra: 10, leituraAnterior: 1352, leituraAtual: 1355, consumo: 3, precoM3: 21.50 },
];

async function main() {
  const condominioId = 1;
  const mesReferencia = "2026-06";
  const dataVencimento = "2026-07-06";
  const taxaCondominioPadrao = 393;
  const taxaExtraPadrao = 10;
  const precoGasM3Padrao = 21.50;

  // Remove cobrança existente de Junho 2026 se houver
  const existente = await prisma.cobrancaMensal.findUnique({
    where: { condominioId_mesReferencia: { condominioId, mesReferencia } },
  });

  if (existente) {
    await prisma.cobrancaMensal.delete({ where: { id: existente.id } });
    console.log("🗑️  Cobrança anterior de Junho 2026 removida.");
  }

  // Busca os apartamentos
  const apartamentos = await prisma.apartamento.findMany({
    where: { condominioId, ativo: true },
    orderBy: { numero: "asc" },
  });

  // Cria a cobrança com os dados da planilha
  const cobranca = await prisma.cobrancaMensal.create({
    data: {
      condominioId,
      mesReferencia,
      dataVencimento,
      taxaCondominioPadrao,
      taxaExtraPadrao,
      precoGasM3Padrao,
      observacoes: "Fazer o depósito via PIX CNPJ na conta do condomínio até dia 06/07/2026.\nFundo de Obras (Proprietários): R$ 100,00 até o dia 10 de cada mês.",
      itens: {
        create: apartamentos.map((apto) => {
          const dado = dadosJunho2026.find((d) => d.numero === apto.numero);
          if (!dado) {
            throw new Error(`Apartamento ${apto.numero} não encontrado na planilha`);
          }

          const valorGas = dado.consumo * dado.precoM3;
          const totalAPagar = dado.taxaCondominio + dado.taxaExtra + valorGas;

          return {
            apartamentoId: apto.id,
            taxaCondominio: dado.taxaCondominio,
            taxaExtra: dado.taxaExtra,
            leituraAnteriorGas: dado.leituraAnterior,
            leituraAtualGas: dado.leituraAtual,
            consumoGas: dado.consumo,
            precoGasM3: dado.precoM3,
            valorGas,
            totalAPagar,
          };
        }),
      },
    },
    include: {
      itens: {
        include: { apartamento: true },
        orderBy: { apartamento: { numero: "asc" } },
      },
    },
  });

  console.log(`\n✅ Cobrança de Junho 2026 criada com sucesso! (ID: ${cobranca.id})\n`);
  console.log("📋 Itens importados da planilha:");
  console.log("─".repeat(90));
  console.log(
    "Apto".padEnd(6) +
    "Taxa Cond.".padStart(12) +
    "Taxa Extra".padStart(12) +
    "Leit. Ant.".padStart(12) +
    "Leit. Atual".padStart(13) +
    "Consumo".padStart(9) +
    "Preço m³".padStart(10) +
    "Valor Gás".padStart(12) +
    "Total".padStart(12)
  );
  console.log("─".repeat(90));

  for (const item of cobranca.itens) {
    console.log(
      item.apartamento.numero.padEnd(6) +
      `R$ ${item.taxaCondominio.toFixed(2)}`.padStart(12) +
      `R$ ${item.taxaExtra.toFixed(2)}`.padStart(12) +
      `${item.leituraAnteriorGas}`.padStart(12) +
      `${item.leituraAtualGas}`.padStart(13) +
      `${item.consumoGas}`.padStart(9) +
      `R$ ${item.precoGasM3.toFixed(2)}`.padStart(10) +
      `R$ ${item.valorGas.toFixed(2)}`.padStart(12) +
      `R$ ${item.totalAPagar.toFixed(2)}`.padStart(12)
    );
  }

  const totalGeral = cobranca.itens.reduce((s, i) => s + Number(i.totalAPagar), 0);
  console.log("─".repeat(90));
  console.log(`${"TOTAL".padEnd(6)}${" ".repeat(58)}${""}${`R$ ${totalGeral.toFixed(2)}`.padStart(12)}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
