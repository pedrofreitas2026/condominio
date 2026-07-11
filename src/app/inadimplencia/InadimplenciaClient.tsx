"use client";

import { useState, useTransition } from "react";
import { registrarPagamentoInadimplencia, Inadimplente } from "@/lib/actions/inadimplencia";
import { formatCurrency, formatMesReferencia } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function InadimplenciaClient({
  inadimplencias,
}: {
  inadimplencias: Inadimplente[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [payModal, setPayModal] = useState<Inadimplente | null>(null);

  const totalEmAberto = inadimplencias.reduce((sum, i) => sum + i.valorEmAberto, 0);

  const handlePagar = async (formData: FormData) => {
    if (!payModal) return;
    const valor = parseFloat(formData.get("valorPago") as string);
    const data = formData.get("dataPagamento") as string;

    startTransition(async () => {
      await registrarPagamentoInadimplencia(payModal.itemId, valor, data);
      setPayModal(null);
      router.refresh();
    });
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Inadimplência</h1>
          <p className="text-text-secondary mt-1">
            {inadimplencias.length} pendência(s) · Total em aberto:{" "}
            <span className="text-red-400 font-semibold">{formatCurrency(totalEmAberto)}</span>
          </p>
        </div>
      </div>

      {inadimplencias.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-emerald-400">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p className="text-emerald-400 text-lg font-semibold">Nenhuma inadimplência!</p>
          <p className="text-text-muted mt-2">Todos os pagamentos estão em dia.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Apartamento</th>
                <th>Mês Referência</th>
                <th className="text-right">Total Devido</th>
                <th className="text-right">Valor Pago</th>
                <th className="text-right">Em Aberto</th>
                <th className="text-center">Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {inadimplencias.map((item) => (
                <tr key={`${item.itemId}`}>
                  <td className="font-semibold">Apto {item.apartamentoNumero}</td>
                  <td>{formatMesReferencia(item.mesReferencia)}</td>
                  <td className="text-right">{formatCurrency(item.totalAPagar)}</td>
                  <td className="text-right text-emerald-400">
                    {item.valorPago > 0 ? formatCurrency(item.valorPago) : "—"}
                  </td>
                  <td className="text-right text-red-400 font-semibold">
                    {formatCurrency(item.valorEmAberto)}
                  </td>
                  <td className="text-center">
                    <span className={`badge ${item.statusPagamento === "pago_parcial" ? "badge-warning" : "badge-danger"}`}>
                      {item.statusPagamento === "pago_parcial" ? "Parcial" : "Pendente"}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => setPayModal(item)}
                      className="btn-success text-xs py-1.5 px-3"
                    >
                      Registrar Pagamento
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="font-bold">Total em Aberto</td>
                <td className="text-right text-red-400 font-bold text-base">
                  {formatCurrency(totalEmAberto)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">
              Registrar Pagamento — Apto {payModal.apartamentoNumero}
            </h2>
            <p className="text-text-secondary mb-4">
              Referência: {formatMesReferencia(payModal.mesReferencia)}
              <br />
              Em aberto: <span className="text-red-400 font-semibold">{formatCurrency(payModal.valorEmAberto)}</span>
            </p>
            <form action={handlePagar} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Valor Pago (R$) *</label>
                <input
                  type="number"
                  name="valorPago"
                  required
                  step="0.01"
                  min="0.01"
                  max={payModal.valorEmAberto}
                  className="input-field"
                  defaultValue={payModal.valorEmAberto}
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Data do Pagamento *</label>
                <input
                  type="date"
                  name="dataPagamento"
                  required
                  className="input-field"
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setPayModal(null)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-success" disabled={isPending}>
                  {isPending ? "Registrando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
