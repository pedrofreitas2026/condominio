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

  return <CobrancaDetalheClient cobranca={cobranca} />;
}
