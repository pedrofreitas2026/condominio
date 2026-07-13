"use client";

import { useState } from "react";
import { formatMesReferencia, formatDate } from "@/lib/utils";
import Link from "next/link";

interface CobrancaItem {
  id: number;
  apartamento: { numero: string };
  taxaCondominio: number;
  taxaExtra: number;
  leituraAnteriorGas: number;
  leituraAtualGas: number;
  consumoGas: number;
  precoGasM3: number;
  valorGas: number;
  totalAPagar: number;
  valorPago: number;
  statusPagamento: string;
}

interface Cobranca {
  id: number;
  mesReferencia: string;
  dataVencimento: string;
  precoGasM3Padrao: number;
  itens: CobrancaItem[];
  totalGeral: number;
  totalTaxas: number;
  totalExtras: number;
  totalGas: number;
  totalConsumoGas: number;
}

interface Receita {
  id: number;
  descricao: string;
  valor: number;
}

interface Despesa {
  id: number;
  descricao: string;
  valor: number;
  categoria: string | null;
}

interface Prestacao {
  id: number;
  mesReferencia: string;
  totalReceitas: number;
  totalDespesas: number;
  creditoMes: number;
  saldoReservaGas: number;
  saldoContaCorrente: number;
  saldoPoupanca: number;
  receitas: Receita[];
  despesas: Despesa[];
}

type ReportType = "cobranca" | "prestacao";

export default function RelatoriosClient({
  cobrancas,
  prestacoes,
}: {
  cobrancas: Cobranca[];
  prestacoes: Prestacao[];
}) {
  const [tipo, setTipo] = useState<ReportType>("cobranca");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedCobranca = cobrancas.find((c) => c.id === selectedId);
  const selectedPrestacao = prestacoes.find((p) => p.id === selectedId);

  const formatCurrency = (value: number | string | null | undefined) => {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  };

  const valorCreditoDeficit = selectedPrestacao
    ? selectedPrestacao.totalReceitas - selectedPrestacao.totalDespesas
    : 0;

  return (
    <div className="fade-in">
      {/* Injeção de estilo específica para travar a impressão em 1 página */}
      <style jsx global>{`
        @media print {
          .page-container-prestacao {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            max-height: 100vh;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="flex items-center justify-between mb-8 no-print">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Relatórios</h1>
          <p className="text-text-secondary mt-1">Gere relatórios para impressão</p>
        </div>
        {selectedId && (
          <button onClick={() => window.print()} className="btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" />
            </svg>
            Imprimir Relatório
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="glass-card rounded-2xl p-5 mb-6 no-print">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Tipo de Relatório</label>
            <select
              className="input-field"
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as ReportType);
                setSelectedId(null);
              }}
            >
              <option value="cobranca">Cobrança Mensal</option>
              <option value="prestacao">Prestação de Contas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Período</label>
            <select
              className="input-field"
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Selecione...</option>
              {tipo === "cobranca"
                ? cobrancas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatMesReferencia(c.mesReferencia)}
                  </option>
                ))
                : prestacoes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatMesReferencia(p.mesReferencia)}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Billing Report */}
      {tipo === "cobranca" && selectedCobranca && (
        <div className="glass-card rounded-2xl p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">Condomínio José Marcolini</h2>
            <h3 className="text-lg text-text-secondary mt-1">
              TAXA — {formatMesReferencia(selectedCobranca.mesReferencia)}
            </h3>
            <p className="text-sm text-text-muted mt-1">
              Vencimento: {formatDate(selectedCobranca.dataVencimento)}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Apto</th>
                  <th className="text-right">Taxa Cond.</th>
                  <th className="text-right">Taxa Extra</th>
                  <th className="text-right">Leit. Ant.</th>
                  <th className="text-right">Leit. Atual</th>
                  <th className="text-right">Consumo</th>
                  <th className="text-right">Preço m³</th>
                  <th className="text-right">Valor Gás</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedCobranca.itens.map((item) => (
                  <tr key={item.id}>
                    <td className="font-semibold">{item.apartamento.numero}</td>
                    <td className="text-right">{formatCurrency(item.taxaCondominio)}</td>
                    <td className="text-right">{formatCurrency(item.taxaExtra)}</td>
                    <td className="text-right">{item.leituraAnteriorGas}</td>
                    <td className="text-right">{item.leituraAtualGas}</td>
                    <td className="text-right">{item.consumoGas}</td>
                    <td className="text-right">{formatCurrency(item.precoGasM3)}</td>
                    <td className="text-right">{formatCurrency(item.valorGas)}</td>
                    <td className="text-right font-semibold">{formatCurrency(item.totalAPagar)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="font-bold">Totais</td>
                  <td className="text-right font-bold">{formatCurrency(selectedCobranca.totalTaxas)}</td>
                  <td className="text-right font-bold">{formatCurrency(selectedCobranca.totalExtras)}</td>
                  <td></td>
                  <td></td>
                  <td className="text-right font-bold">{selectedCobranca.totalConsumoGas}</td>
                  <td></td>
                  <td className="text-right font-bold">{formatCurrency(selectedCobranca.totalGas)}</td>
                  <td className="text-right font-bold text-primary-300">{formatCurrency(selectedCobranca.totalGeral)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Financial Statement Report */}
      {tipo === "prestacao" && selectedPrestacao && (
        <div className="glass-card rounded-2xl p-6 page-container-prestacao">
          {/* ============ PRINT LAYOUT ============ */}
          <div className="print-layout">
            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <h1 style={{ fontSize: "16pt", fontWeight: "bold", margin: "0", border: "2px solid #333", padding: "8px", background: "#f0f0f0", color: "#000" }}>
                CONDOMÍNIO JOSÉ MARCOLINI
              </h1>
              <h2 style={{ fontSize: "12pt", fontWeight: "bold", margin: "0", border: "2px solid #000", borderTop: "none", padding: "6px", color: "#000" }}>
                DEMONSTRATIVO DE PRESTAÇÃO DE CONTAS — MÊS: {formatMesReferencia(selectedPrestacao.mesReferencia).toUpperCase()}
              </h2>
            </div>
          </div>

          {/* Mudança de grid-cols-1 para md:grid-cols-2 apenas em telas, mas forçado a 2 colunas lado a lado na impressão */}
          <div className="grid grid-cols-2 gap-6 mt-4 [media_print]:grid-cols-2">
            {/* Receitas */}
            <div>
              <h4 className="font-bold text-emerald-400 mb-2 print-color-adjust">Receitas</h4>
              <table className="data-table text-sm">
                <tbody>
                  {selectedPrestacao.receitas.map((r) => (
                    <tr key={r.id}>
                      <td>{r.descricao}</td>
                      <td className="text-right text-emerald-400 print-color-adjust">{formatCurrency(r.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="font-bold">Total Receitas</td>
                    <td className="text-right text-emerald-400 font-bold print-color-adjust">{formatCurrency(selectedPrestacao.totalReceitas)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Despesas */}
            <div>
              <h4 className="font-bold text-red-400 mb-2 print-color-adjust">Despesas</h4>
              <table className="data-table text-sm">
                <tbody>
                  {selectedPrestacao.despesas.map((d) => (
                    <tr key={d.id}>
                      <td>{d.descricao}</td>
                      <td className="text-right text-red-400 print-color-adjust">{formatCurrency(d.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="font-bold">Total Despesas</td>
                    <td className="text-right text-red-400 font-bold print-color-adjust">{formatCurrency(selectedPrestacao.totalDespesas)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Result */}
          <div className="mt-4 p-3 bg-surface rounded-xl border border-border text-center print-border-adjust">
            <p className="text-text-secondary text-xs mb-1">Crédito/Déficit do Mês</p>
            <p className={`text-xl font-bold ${valorCreditoDeficit >= 0 ? "text-emerald-400" : "text-red-400"} print-color-adjust`}>
              {formatCurrency(valorCreditoDeficit)}
            </p>
          </div>

          {/* Balances */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="p-2 bg-surface rounded-xl border border-border text-center print-border-adjust">
              <p className="text-xs text-text-muted mb-1">Reserva Gás</p>
              <p className="font-bold text-blue-400 print-color-adjust text-sm">{formatCurrency(selectedPrestacao.saldoReservaGas)}</p>
            </div>
            <div className="p-2 bg-surface rounded-xl border border-border text-center print-border-adjust">
              <p className="text-xs text-text-muted mb-1">Conta Corrente</p>
              <p className="font-bold text-emerald-400 print-color-adjust text-sm">{formatCurrency(selectedPrestacao.saldoContaCorrente)}</p>
            </div>
            <div className="p-2 bg-surface rounded-xl border border-border text-center print-border-adjust">
              <p className="text-xs text-text-muted mb-1">Poupança</p>
              <p className="font-bold text-purple-400 print-color-adjust text-sm">{formatCurrency(selectedPrestacao.saldoPoupanca)}</p>
            </div>
          </div>
        </div>
      )}

      {/* No selection */}
      {!selectedId && (
        <div className="glass-card rounded-2xl p-12 text-center no-print">
          <svg xmlns="http://www.w3.org/2000/xl" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-text-muted">
            <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="m7 17 4-8 4 4 4-6" />
          </svg>
          <p className="text-text-secondary text-lg">Selecione um período para gerar o relatório</p>
        </div>
      )}
    </div>
  );
}