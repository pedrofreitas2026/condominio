export const dynamic = 'force-dynamic'; import { getPrestacoes } from "@/lib/actions/prestacao";
import { formatCurrency, formatMesReferencia } from "@/lib/utils";
import Link from "next/link";
import NovaPrestacaoForm from "./NovaPrestacaoForm";

export default async function PrestacaoPage() {
  const prestacoes = await getPrestacoes();

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Prestação de Contas</h1>
          <p className="text-text-secondary mt-1">
            {prestacoes.length} prestação(ões) registrada(s)
          </p>
        </div>
        <NovaPrestacaoForm />
      </div>

      {prestacoes.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-text-muted">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" /><path d="m9 15 2 2 4-4" />
          </svg>
          <p className="text-text-secondary text-lg">Nenhuma prestação de contas</p>
          <p className="text-text-muted mt-2">Crie a primeira prestação de contas do condomínio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prestacoes.map((p) => {
            // Realiza o cálculo dinâmico para cada item da lista externa
            const valorCreditoDeficit = p.totalReceitas - p.totalDespesas;

            return (
              <Link
                key={p.id}
                href={`/prestacao/${p.id}`}
                className="glass-card rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300 block"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg text-text-primary">
                    {formatMesReferencia(p.mesReferencia)}
                  </h3>
                  <span className={`badge ${p.status === "fechada" ? "badge-success" : "badge-info"}`}>
                    {p.status === "fechada" ? "Fechada" : "Aberta"}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Receitas</span>
                    <span className="text-emerald-400">{formatCurrency(p.totalReceitas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Despesas</span>
                    <span className="text-red-400">{formatCurrency(p.totalDespesas)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span className="text-text-secondary font-semibold">Crédito/Déficit</span>
                    <span className={`font-bold ${valorCreditoDeficit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatCurrency(valorCreditoDeficit)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}