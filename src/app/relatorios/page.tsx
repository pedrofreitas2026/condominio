import { getCobrancas } from "@/lib/actions/cobrancas";
import { getPrestacoes } from "@/lib/actions/prestacao";
import RelatoriosClient from "./RelatoriosClient";

export default async function RelatoriosPage() {
  const cobrancas = await getCobrancas();
  const prestacoes = await getPrestacoes();

  return <RelatoriosClient cobrancas={cobrancas} prestacoes={prestacoes} />;
}
