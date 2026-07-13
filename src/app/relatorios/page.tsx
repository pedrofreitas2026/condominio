// @/app/relatorios/page.tsx
import RelatoriosClient from "./RelatoriosClient";

interface CobrancaItem {
  id: number;
  apartamento: { numero: string };
  taxaCondominio: number;
  taxaExtra: number;
  leituraAnteriorGas: number;
  leituraAtualGas: number;
  consumoGas: number;
  precoGasM3: number;
  valorGas: number;
  totalAPagar: number;
  valorPago: number;
  statusPagamento: string;
}

interface Cobranca {
  id: number;
  mesReferencia: string;
  dataVencimento: string;
  precoGasM3Padrao: number;
  itens: CobrancaItem[];
  totalGeral: number;
  totalTaxas: number;
  totalExtras: number;
  totalGas: number;
  totalConsumoGas: number;
}

interface Prestacao {
  id: number;
  mesReferencia: string;
  totalReceitas: number;
  totalDespesas: number;
  creditoMes: number;
  saldoReservaGas: number;
  saldoContaCorrente: number;
  saldoPoupanca: number;
  receitas: { id: number; descricao: string; valor: number }[];
  despesas: { id: number; descricao: string; valor: number; categoria: string | null }[];
}

export default async function RelatoriosPage() {
  // Dados simulados para você testar a filtragem por apartamento e a emissão do recibo
  const cobrancas: Cobranca[] = [
    {
      id: 1,
      mesReferencia: "2026-07",
      dataVencimento: "2026-07-10",
      precoGasM3Padrao: 8.5,
      totalGeral: 750,
      totalTaxas: 600,
      totalExtras: 0,
      totalGas: 150,
      totalConsumoGas: 17.6,
      itens: [
        {
          id: 101,
          apartamento: { numero: "101" },
          taxaCondominio: 300,
          taxaExtra: 0,
          leituraAnteriorGas: 100,
          leituraAtualGas: 110,
          consumoGas: 10,
          precoGasM3: 8.5,
          valorGas: 85,
          totalAPagar: 385,
          valorPago: 385,
          statusPagamento: "PAGO", // Gera o botão de Recibo
        },
        {
          id: 102,
          apartamento: { numero: "102" },
          taxaCondominio: 300,
          taxaExtra: 0,
          leituraAnteriorGas: 150,
          leituraAtualGas: 157.6,
          consumoGas: 7.6,
          precoGasM3: 8.5,
          valorGas: 64.6,
          totalAPagar: 364.6,
          valorPago: 0,
          statusPagamento: "PENDENTE", // Mostra a badge de Pendente
        },
      ],
    },
  ];

  const prestacoes: Prestacao[] = [
    {
      id: 1,
      mesReferencia: "2026-07",
      totalReceitas: 5000,
      totalDespesas: 4200,
      creditoMes: 800,
      saldoReservaGas: 1200,
      saldoContaCorrente: 3500,
      saldoPoupanca: 15000,
      receitas: [{ id: 1, descricao: "Taxas Condominiais", valor: 5000 }],
      despesas: [
        { id: 1, descricao: "Copasa", valor: 1200, categoria: "Água" },
        { id: 2, descricao: "Cemig", valor: 3000, categoria: "Luz" },
      ],
    },
  ];

  // =========================================================================
  // CONFIGURAÇÃO DE TESTE DE PERFIL (Altere aqui para validar os cenários)
  // =========================================================================

  // CENÁRIO A: SÍNDICO (Vê todas as linhas e a Prestação de Contas)
  const usuarioLogado = {
    id: 1,
    nome: "Carlos S.",
    role: "sindico" as const,
  };

  /*
  // CENÁRIO B: MORADOR DO 101 (Só vê a sua linha, o seu recibo e NÃO vê Prestação de Contas)
  const usuarioLogado = {
    id: 10,
    nome: "Morador Apto 101",
    role: "morador" as const,
    apartamento: "101",
  };
  */

  return (
    <RelatoriosClient
      cobrancas={cobrancas}
      prestacoes={prestacoes}
      usuarioLogado={usuarioLogado}
    />
  );
}