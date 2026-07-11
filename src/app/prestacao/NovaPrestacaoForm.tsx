"use client";

import { useState } from "react";
import { createPrestacao } from "@/lib/actions/prestacao";
import { useRouter } from "next/navigation";
import { getCurrentMonthRef } from "@/lib/utils";

export default function NovaPrestacaoForm() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const id = await createPrestacao(formData);
      setShowModal(false);
      router.push(`/prestacao/${id}`);
    } catch {
      alert("Erro ao criar prestação. Verifique se já existe uma para este mês.");
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} className="btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" /><path d="M5 12h14" />
        </svg>
        Nova Prestação
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Nova Prestação de Contas</h2>
            <p className="text-text-secondary text-sm mb-4">
              As receitas da cobrança do mês serão importadas automaticamente.
            </p>
            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Mês de Referência *</label>
                <input
                  type="month"
                  name="mesReferencia"
                  required
                  className="input-field"
                  defaultValue={getCurrentMonthRef()}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Saldo Mês Anterior (R$)</label>
                  <input
                    type="number"
                    name="saldoMesAnterior"
                    step="0.01"
                    className="input-field"
                    defaultValue="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Saldo Reserva Gás (R$)</label>
                  <input
                    type="number"
                    name="saldoReservaGas"
                    step="0.01"
                    className="input-field"
                    defaultValue="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Saldo Conta Corrente (R$)</label>
                  <input
                    type="number"
                    name="saldoContaCorrente"
                    step="0.01"
                    className="input-field"
                    defaultValue="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Saldo Poupança (R$)</label>
                  <input
                    type="number"
                    name="saldoPoupanca"
                    step="0.01"
                    className="input-field"
                    defaultValue="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Criando..." : "Criar Prestação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
