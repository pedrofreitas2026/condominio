"use client";

import { useState } from "react";
import { formatMesReferencia, formatDate } from "@/lib/utils";
import Link from "next/link";

// ================= TIPAGENS =================
interface UsuarioLogado {
  id: number;
  nome: string;
  role: "sindico" | "morador";
  apartamento?: string; // Obrigatório se role for 'morador'
}

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
  statusPagamento: string; // Ex: "PAGO" ou "PENDENTE"
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

type ReportType = "cobranca" | "prestacao" | "recibo";

// ================= SUBCOMPONENTE DE RECIBO =================
interface ReciboImpressaoProps {
  cobranca: Cobranca;
  item: CobrancaItem;
  formatCurrency: (value: number) => string;
}

function ReciboImpressao({ cobranca, item, formatCurrency }: ReciboImpressaoProps) {
  return (
    <div className="print-layout page-container-recibo" style={{ padding: "24px", color: "#000", backgroundColor: "#fff", border: "1px dashed #000" }}>
      <style jsx global>{`
        @media print {
          .page-container-recibo {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "12px", marginBottom: "16px" }}>
        <h1 style={{ fontSize: "16pt", fontWeight: "bold", margin: "0" }}>CONDOMÍNIO JOSÉ MARCOLINI</h1>
        <h2 style={{ fontSize: "12pt", fontWeight: "bold", margin: "4px 0 0 0", color: "#333" }}>
          RECIBO DE PAGAMENTO DE CONDOMÍNIO
        </h2>
      </div>

      <div style={{ fontSize: "11pt", lineHeight: "1.6", marginBottom: "24px", textAlign: "justify" }}>
        <p>
          Confirmamos que o <strong>Apartamento {item.apartamento.numero}</strong> efetuou o pagamento do valor de{" "}
          <strong>{formatCurrency(item.valorPago || item.totalAPagar)}</strong> referente à taxa condominial e despesas rateadas do mês de{" "}
          <strong>{formatMesReferencia(cobranca.mesReferencia).toUpperCase()}</strong>, estando quitadas as obrigações listadas abaixo.
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #000" }}>
              <th style={{ textAlign: "left", padding: "6px 0" }}>Descrição</th>
              <th style={{ textAlign: "right", padding: "6px 0" }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "6px 0" }}>Taxa de Condomínio Ordinária</td>
              <td style={{ textAlign: "right" }}>{formatCurrency(item.taxaCondominio)}</td>
            </tr>
            {item.taxaExtra > 0 && (
              <tr>
                <td style={{ padding: "6px 0" }}>Taxa Extra / Fundo de Reserva</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(item.taxaExtra)}</td>
              </tr>
            )}
            {item.valorGas > 0 && (
              <tr>
                <td style={{ padding: "6px 0" }}>Consumo Individual de Gás ({item.consumoGas} m³)</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(item.valorGas)}</td>
              </tr>
            )}
            <tr style={{ borderTop: "1px solid #000", fontWeight: "bold" }}>
              <td style={{ padding: "8px 0" }}>Total Liquidado</td>
              <td style={{ textAlign: "right", padding: "8px 0" }}>{formatCurrency(item.valorPago || item.totalAPagar)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "48px", textAlign: "center" }}>
        <div style={{ width: "250px", borderTop: "1px solid #000", margin: "0 auto", paddingBottom: "4px" }}>
          Administração / Síndico
        </div>
        <p style={{ fontSize: "9pt", color: "#666", margin: "4px 0 0 0" }}>
          Emitido via sistema em {new Date().toLocaleDateString("pt-BR")}
        </p>
      </div>
    </div>
  );
}

// ================= COMPONENTE PRINCIPAL =================
export default function RelatoriosClient({
  cobrancas,
  prestacoes,
  usuarioLogado = { id: 0, nome: "Síndico", role: "sindico" },
}: {
  cobrancas: Cobranca[];
  prestacoes: Prestacao[];
  usuarioLogado?: UsuarioLogado;
}) {
  const [tipo, setTipo] = useState<ReportType>("cobranca");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [itemReciboSelecionado, setItemReciboSelecionado] = useState<CobrancaItem | null>(null);

  const selectedCobranca = cobrancas.find((c) => c.id === selectedId);
  const selectedPrestacao = prestacoes.find((p) => p.id === selectedId);

  const isMorador = usuarioLogado.role === "morador";

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

  // Filtragem estrita de segurança para moradores nas cobranças
  const obterCobrancaFiltrada = () => {
    if (!selectedCobranca) return null;
    if (!isMorador) return selectedCobranca;

    // Se for morador, filtra apenas a linha correspondente ao seu apartamento
    const itensFiltrados = selectedCobranca.itens.filter(
      (item) => item.apartamento.numero === usuarioLogado.apartamento
    );

    return {
      ...selectedCobranca,
      itens: itensFiltrados,
      totalGeral: itensFiltrados.reduce((acc, curr) => acc + curr.totalAPagar, 0),
    };
  };

  const cobrancaExibida = obterCobrancaFiltrada();

  return (
    <div className="fade-in">
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

      {/* Header */}
      <div className="flex items-center justify-between mb-8 no-print">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Relatórios</h1>
          <p className="text-text-secondary mt-1">
            {isMorador ? "Consulte suas taxas e emissões" : "Gere relatórios para impressão"}
          </p>
        </div>
        {selectedId && tipo !== "recibo" && (
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
              value={tipo === "recibo" ? "cobranca" : tipo}
              onChange={(e) => {
                setTipo(e.target.value as ReportType);
                setSelectedId(null);
                setItemReciboSelecionado(null);
              }}
            >
              <option value="cobranca">Cobrança Mensal</option>
              {!isMorador && <option value="prestacao">Prestação de Contas</option>}
            </select>
          </div>

          {tipo !== "recibo" && (
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
          )}
        </div>
      </div>

      {/* Recibo View Render */}
      {tipo === "recibo" && selectedCobranca && itemReciboSelecionado && (
        <div className="mt-4">
          <div className="flex gap-2 mb-4 no-print">
            <button
              onClick={() => { setTipo("cobranca"); setItemReciboSelecionado(null); }}
              className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition"
            >
              ← Voltar para Listagem
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
            >
              Imprimir Recibo
            </button>
          </div>
          <ReciboImpressao
            cobranca={selectedCobranca}
            item={itemReciboSelecionado}
            formatCurrency={formatCurrency}
          />
        </div>
      )}

      {/* Billing Report */}
      {tipo === "cobranca" && cobrancaExibida && (
        <div className="glass-card rounded-2xl p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">Condomínio José Marcolini</h2>
            <h3 className="text-lg text-text-secondary mt-1">
              TAXA — {formatMesReferencia(cobrancaExibida.mesReferencia)}
            </h3>
            <p className="text-sm text-text-muted mt-1">
              Vencimento: {formatDate(cobrancaExibida.dataVencimento)}
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
                  <th className="text-center no-print">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cobrancaExibida.itens.map((item) => (
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
                    <td className="text-center no-print">
                      {item.statusPagamento === "PAGO" ? (
                        <button
                          onClick={() => {
                            setItemReciboSelecionado(item);
                            setTipo("recibo");
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition"
                        >
                          Recibo
                        </button>
                      ) : (
                        <span className="text-xs text-red-400 font-medium bg-red-950/30 px-2 py-1 rounded">
                          Pendente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {!isMorador && (
                <tfoot>
                  <tr>
                    <td className="font-bold">Totais</td>
                    <td className="text-right font-bold">{formatCurrency(cobrancaExibida.totalTaxas)}</td>
                    <td className="text-right font-bold">{formatCurrency(cobrancaExibida.totalExtras)}</td>
                    <td></td>
                    <td></td>
                    <td className="text-right font-bold">{cobrancaExibida.totalConsumoGas}</td>
                    <td></td>
                    <td className="text-right font-bold">{formatCurrency(cobrancaExibida.totalGas)}</td>
                    <td className="text-right font-bold text-primary-300">{formatCurrency(cobrancaExibida.totalGeral)}</td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Financial Statement Report */}
      {tipo === "prestacao" && selectedPrestacao && !isMorador && (
        <div className="glass-card rounded-2xl p-6 page-container-prestacao">
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
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-text-muted">
            <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="m7 17 4-8 4 4 4-6" />
          </svg>
          <p className="text-text-secondary text-lg">Selecione um período para gerar o relatório</p>
        </div>
      )}
    </div>
  );
}