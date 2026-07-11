export const dynamic = 'force-dynamic';
import { getInadimplencias } from "@/lib/actions/inadimplencia";
import InadimplenciaClient from "./InadimplenciaClient";

export default async function InadimplenciaPage() {
  const inadimplencias = await getInadimplencias();

  return <InadimplenciaClient inadimplencias={inadimplencias} />;
}
