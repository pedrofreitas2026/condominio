import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Lista todas as cobranças
  const cobrancas = await prisma.cobrancaMensal.findMany({
    include: { itens: { include: { apartamento: true } } },
    orderBy: { mesReferencia: "asc" },
  });

  console.log(`\n📋 Total de cobranças: ${cobrancas.length}\n`);
  for (const c of cobrancas) {
    console.log(`ID: ${c.id} | Mês: ${c.mesReferencia} | Itens: ${c.itens.length}`);
    for (const item of c.itens) {
      console.log(`   Apto ${item.apartamento.numero} | Leit.Ant: ${item.leituraAnteriorGas} | Leit.Atual: ${item.leituraAtualGas}`);
    }
  }

  // Simula a busca que createCobranca faria para Julho 2026
  const mesRef = "2026-07";
  console.log(`\n🔍 Buscando cobrança anterior a "${mesRef}"...`);
  const prev = await prisma.cobrancaMensal.findFirst({
    where: { condominioId: 1, mesReferencia: { lt: mesRef } },
    orderBy: { mesReferencia: "desc" },
    include: { itens: { include: { apartamento: true } } },
  });

  if (prev) {
    console.log(`✅ Encontrada: ID ${prev.id} | Mês: ${prev.mesReferencia}`);
    for (const item of prev.itens) {
      console.log(`   Apto ${item.apartamento.numero} | Leit.Atual (será a Ant. de Jul): ${item.leituraAtualGas}`);
    }
  } else {
    console.log("❌ Nenhuma cobrança anterior encontrada!");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
