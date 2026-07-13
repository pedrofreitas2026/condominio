// @/app/relatorios/page.tsx
import RelatoriosClient from "./RelatoriosClient";

// 1. Definição local das interfaces para o servidor reconhecer os tipos dos arrays vazios
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
  // 2. Tipagem explícita adicionada aos arrays vazios para eliminar os erros de 'any[]'
  const cobrancas: Cobranca[] = [];
  const prestacoes: Prestacao[] = [];

  // 3. Adicionado 'as const' para fixar o tipo literal da propriedade role como '"sindico"' em vez de 'string'
  const usuarioLogado = {
    id: 1,
    nome: "Carlos S.",
    role: "sindico" as const, // Força o TypeScript a entender o valor exato exigido pela interface
  };

  return (
    <RelatoriosClient
      cobrancas={cobrancas}
      prestacoes={prestacoes}
      usuarioLogado={usuarioLogado}
    />
  );
}