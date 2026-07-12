export const dynamic = 'force-dynamic';
import { getCobranca } from "@/lib/actions/cobrancas";
import { notFound } from "next/navigation";
import CobrancaDetalheClient from "./CobrancaDetalheClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CobrancaDetalhePage({ params }: PageProps) {
  const { id } = await params;
  const cobranca = await getCobranca(parseInt(id));

  if (!cobranca) {
    notFound();
  }

  // Tratamento completo e seguro: limpa os Decimals e as datas do objeto antes de enviar ao cliente
  const cobrancaFormatada = {
    ...cobranca,
    dataVencimento: cobranca.dataVencimento
      ? new Date(cobranca.dataVencimento).toISOString()
      : "",
    // Mapeia e higieniza os valores financeiros de cada item do array que quebrava no frontend
    itens: cobranca.itens?.map((item: any) => ({
      ...item,
      taxaCondominio: Number(item.taxaCondominio),
      taxaExtra: Number(item.taxaExtra),
      leituraAnteriorGas: Number(item.leituraAnteriorGas),
      leituraAtualGas: Number(item.leituraAtualGas),
      consumoGas: Number(item.consumoGas),
      precoGasM3: Number(item.precoGasM3),
      valorGas: Number(item.valorGas),
      totalAPagar: Number(item.totalAPagar),
      valorPago: Number(item.valorPago),
    })) || [],
  };

  return <CobrancaDetalheClient cobranca={cobrancaFormatada as any} />;
}