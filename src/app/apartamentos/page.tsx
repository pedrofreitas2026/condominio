export const dynamic = 'force-dynamic';
import { getApartamentos } from "@/lib/actions/apartamentos";
import ApartamentosClient from "./ApartamentosClient";

export default async function ApartamentosPage() {
  const apartamentos = await getApartamentos();

  return <ApartamentosClient apartamentos={apartamentos} />;
}
