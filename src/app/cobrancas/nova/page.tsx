"use client";

import { useState } from "react";
import { createCobranca } from "@/lib/actions/cobrancas";
import { useRouter } from "next/navigation";
import { getCurrentMonthRef } from "@/lib/utils";

export default function NovaCobrancaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copiarAnterior, setCopiarAnterior] = useState(true);

  const currentMonth = getCurrentMonthRef();

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      formData.set("copiarAnterior", copiarAnterior ? "true" : "false");
      const id = await createCobranca(formData);
      router.push(`/cobrancas/${id}`);
    } catch {
      alert("Erro ao criar cobrança. Verifique se já existe uma cobrança para este mês.");
      setLoading(false);
    }
  };

  return (
    <div className="fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Nova Cobrança Mensal</h1>
        <p className="text-text-secondary mt-1">
          Preencha os dados da cobrança. Os itens serão gerados automaticamente para cada apartamento ativo.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <form action={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Mês de Referência *
              </label>
              <input
                type="month"
                name="mesReferencia"
                required
                className="input-field"
                defaultValue={currentMonth}
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Data de Vencimento *
              </label>
              <input
                type="date"
                name="dataVencimento"
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Taxa de Condomínio (R$) *
              </label>
              <input
                type="number"
                name="taxaCondominioPadrao"
                required
                step="0.01"
                min="0"
                className="input-field"
                placeholder="393.00"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Taxa Extra (R$)
              </label>
              <input
                type="number"
                name="taxaExtraPadrao"
                step="0.01"
                min="0"
                className="input-field"
                defaultValue="0"
                placeholder="10.00"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Preço Gás/m³ (R$) *
              </label>
              <input
                type="number"
                name="precoGasM3Padrao"
                required
                step="0.01"
                min="0"
                className="input-field"
                placeholder="21.50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Observações
            </label>
            <textarea
              name="observacoes"
              rows={3}
              className="input-field"
              placeholder="Instruções de pagamento, PIX, fundo de obras..."
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
            <input
              type="checkbox"
              id="copiarAnterior"
              checked={copiarAnterior}
              onChange={(e) => setCopiarAnterior(e.target.checked)}
              className="w-4 h-4 rounded accent-primary-500"
            />
            <label htmlFor="copiarAnterior" className="text-sm text-text-secondary cursor-pointer">
              Copiar leituras de gás do mês anterior (leitura atual → leitura anterior)
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => router.push("/cobrancas")}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Criando..." : "Criar Cobrança"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
