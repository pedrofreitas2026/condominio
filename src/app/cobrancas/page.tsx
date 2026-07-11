export const dynamic = 'force-dynamic';
import { getCobrancas } from "@/lib/actions/cobrancas";
import { formatCurrency, formatMesReferencia, formatDate } from "@/lib/utils";
import Link from "next/link";
import { DeleteCobrancaButton } from "./DeleteCobrancaButton";

export default async function CobrancasPage() {
  const cobrancas = await getCobrancas();

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Cobranças Mensais</h1>
          <p className="text-text-secondary mt-1">
            {cobrancas.length} cobrança(s) registrada(s)
          </p>
        </div>
        <Link href="/cobrancas/nova" className="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          Nova Cobrança
        </Link>
      </div>

      {cobrancas.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-text-muted">
            <path d="M16 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
            <path d="M12 6v4" /><path d="M12 14h.01" />
          </svg>
          <p className="text-text-secondary text-lg">Nenhuma cobrança cadastrada</p>
          <p className="text-text-muted mt-2">Crie a primeira cobrança mensal do condomínio.</p>
          <Link href="/cobrancas/nova" className="btn-primary mt-4 inline-flex">
            Criar Primeira Cobrança
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cobrancas.map((cobranca) => (
            <div
              key={cobranca.id}
              className="glass-card rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300 relative group"
            >
              {/* Delete button */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <DeleteCobrancaButton
                  id={cobranca.id}
                  mesReferencia={formatMesReferencia(cobranca.mesReferencia)}
                />
              </div>

              <Link href={`/cobrancas/${cobranca.id}`} className="block">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg text-text-primary">
                    {formatMesReferencia(cobranca.mesReferencia)}
                  </h3>
                  <span className={`badge ${cobranca.status === "fechada" ? "badge-success" : "badge-info"} mr-8`}>
                    {cobranca.status === "fechada" ? "Fechada" : "Aberta"}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Vencimento</span>
                    <span className="text-text-primary">{formatDate(cobranca.dataVencimento)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Taxas</span>
                    <span className="text-text-primary">{formatCurrency(cobranca.totalTaxas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Gás</span>
                    <span className="text-text-primary">{formatCurrency(cobranca.totalGas)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span className="text-text-secondary font-semibold">Total Geral</span>
                    <span className="text-primary-400 font-bold text-base">{formatCurrency(cobranca.totalGeral)}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
