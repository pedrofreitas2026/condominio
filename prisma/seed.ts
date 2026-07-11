import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create condominium
  const condo = await prisma.condominio.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nome: "Condomínio José Marcolini",
      cnpjPix: "00.000.000/0001-00",
      responsavel: "Síndica",
      textoPadraoCobranca:
        "Fazer o depósito via PIX na conta do condomínio até o dia do vencimento.",
      textoPadraoFundoObras:
        "Pagamento de R$100,00 referente ao fundo de obras.",
    },
  });

  // Create 9 apartments
  const apartamentos = [
    { numero: "101" },
    { numero: "102" },
    { numero: "103" },
    { numero: "201" },
    { numero: "202" },
    { numero: "203" },
    { numero: "301" },
    { numero: "302" },
    { numero: "303" },
  ];

  for (const apto of apartamentos) {
    await prisma.apartamento.upsert({
      where: {
        condominioId_numero: {
          condominioId: condo.id,
          numero: apto.numero,
        },
      },
      update: {},
      create: {
        condominioId: condo.id,
        numero: apto.numero,
        ativo: true,
      },
    });
  }

  console.log("✅ Seed completed: Condomínio + 9 apartamentos criados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
