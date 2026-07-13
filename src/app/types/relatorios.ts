// @/types/relatorios.ts

export interface UsuarioLogado {
  id: number;
  nome: string;
  role: "sindico" | "morador";
  apartamento?: string; // Obrigatório se for morador
}

export interface CobrancaItem {
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
  statusPagamento: "PENDENTE" | "PAGO";
}

export interface Cobranca {
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

export interface Receita {
  id: number;
  descricao: string;
  valor: number;
}

export interface Despesa {
  id: number;
  descricao: string;
  valor: number;
  categoria: string | null;
}

export interface Prestacao {
  id: number;
  mesReferencia: string;
  totalReceitas: number;
  totalDespesas: number;
  creditoMes: number;
  saldoReservaGas: number;
  saldoContaCorrente: number;
  saldoPoupanca: number;
  receitas: Receita[];
  despesas: Despesa[];
}