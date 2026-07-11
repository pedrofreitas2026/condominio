export const dynamic = 'force-dynamic';
import { getDashboardData } from "@/lib/actions/dashboard";
import { formatCurrency, formatMesReferencia } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const data = await getDashboardData();

  const cards = [
    {
      label: "Total Previsto",
      value: formatCurrency(data.totalPrevisto),
      gradient: "gradient-card-blue",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <path d="M16 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
          <path d="M12 6v4" /><path d="M12 14h.01" />
        </svg>
      ),
    },
    {
      label: "Total Recebido",
      value: formatCurrency(data.totalRecebido),
      gradient: "gradient-card-green",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
        </svg>
      ),
    },
    {
      label: "Total em Atraso",
      value: formatCurrency(data.totalEmAtraso),
      gradient: "gradient-card-red",
      subtitle: `${data.qtdInadimplentes} pendência(s)`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      ),
    },
    {
      label: "Despesas do Mês",
      value: formatCurrency(data.totalDespesas),
      gradient: "gradient-card-amber",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
          <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2" />
          <path d="M2 9v1c0 1.1.9 2 2 2h1" />
        </svg>
      ),
    },
    {
      label: "Crédito/Déficit",
      value: formatCurrency(data.creditoMes),
      gradient: data.creditoMes >= 0 ? "gradient-card-green" : "gradient-card-red",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={data.creditoMes >= 0 ? "text-emerald-400" : "text-red-400"}>
          <line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

  const saldos = [
    {
      label: "Reserva para Gás",
      value: formatCurrency(data.saldoReservaGas),
      color: "text-blue-400",
    },
    {
      label: "Conta Corrente",
      value: formatCurrency(data.saldoContaCorrente),
      color: "text-emerald-400",
    },
    {
      label: "Conta Poupança",
      value: formatCurrency(data.saldoPoupanca),
      color: "text-purple-400",
    },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          {data.mesAtual
            ? `Referência: ${formatMesReferencia(data.mesAtual)}`
            : "Nenhuma cobrança cadastrada"}
        </p>
      </div>

      {/* Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`${card.gradient} rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              {card.icon}
            </div>
            <p className="stat-value">{card.value}</p>
            <p className="stat-label">{card.label}</p>
            {"subtitle" in card && card.subtitle && (
              <p className="text-xs text-text-muted mt-1">{card.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* Saldos Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {saldos.map((saldo, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <p className="text-sm text-text-secondary mb-2">{saldo.label}</p>
            <p className={`text-xl font-bold ${saldo.color}`}>{saldo.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="section-title mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/cobrancas/nova" className="btn-primary justify-center py-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Nova Cobrança
          </Link>
          <Link href="/prestacao" className="btn-secondary justify-center py-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6" />
            </svg>
            Prestação de Contas
          </Link>
          <Link href="/inadimplencia" className="btn-secondary justify-center py-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" /><path d="M12 17h.01" />
            </svg>
            Ver Inadimplência
          </Link>
        </div>
      </div>
    </div>
  );
}
