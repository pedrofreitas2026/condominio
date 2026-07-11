export const dynamic = 'force-dynamic';
import { getPrestacao } from "@/lib/actions/prestacao";
import { notFound } from "next/navigation";
import PrestacaoDetalheClient from "./PrestacaoDetalheClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PrestacaoDetalhePage({ params }: PageProps) {
  const { id } = await params;
  const prestacao = await getPrestacao(parseInt(id));

  if (!prestacao) {
    notFound();
  }

  return <PrestacaoDetalheClient prestacao={prestacao} />;
}


