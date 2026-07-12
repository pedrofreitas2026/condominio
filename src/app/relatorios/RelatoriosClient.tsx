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

interface Atraso {
  id: number;
  mesReferencia: string;
  valor: number;
}

interface Prestacao {
  id: number;
  mesReferencia: string;
  saldoMesAnterior: number;
  totalReceitas: number;
  totalDespesas: number;
  creditoMes: number;
  totalAtrasos: number;
  saldoReservaGas: number;
  saldoContaCorrente: number;
  saldoPoupanca: number;
  receitas: Receita[];
  despesas: Despesa[];
  atrasos?: Atraso[];
  movimentacoes?: any[];
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

  const fmtNum = (value: number | string | null | undefined) => {
    const amount = Number(value ?? 0);
    return (Number.isFinite(amount) ? amount : 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Tratamentos aritméticos preventivos para a prestação de contas
  const saldoAnterior = selectedPrestacao ? parseFloat(String(selectedPrestacao.saldoMesAnterior || 0)) : 0;
  const tReceitas = selectedPrestacao ? parseFloat(String(selectedPrestacao.totalReceitas || 0)) : 0;
  const tDespesas = selectedPrestacao ? parseFloat(String(selectedPrestacao.totalDespesas || 0)) : 0;
  const totalAtrasos = selectedPrestacao?.atrasos?.reduce((sum, a) => sum + parseFloat(String(a.valor || 0)), 0) ?? 0;
  const totalReceitasPlanilha = saldoAnterior + tReceitas;
  const creditoMesCalculado = totalReceitasPlanilha - tDespesas;

  const movGas = selectedPrestacao?.movimentacoes?.filter(m => m.conta === "reserva_gas") || [];
  const movCC = selectedPrestacao?.movimentacoes?.filter(m => m.conta === "conta_corrente") || [];
  const movPoupança = selectedPrestacao?.movimentacoes?.filter(m => m.conta === "poupanca") || [];

  const saldoFinalGas = selectedPrestacao ? movGas.reduce((sum, m) => sum + (m.tipo === "entrada" ? parseFloat(String(m.valor)) : -parseFloat(String(m.valor))), parseFloat(String(selectedPrestacao.saldoReservaGas || 0))) : 0;
  const saldoFinalCC = selectedPrestacao ? movCC.reduce((sum, m) => sum + (m.tipo === "entrada" ? parseFloat(String(m.valor)) : -parseFloat(String(m.valor))), parseFloat(String(selectedPrestacao.saldoContaCorrente || 0))) : 0;
  const saldoFinalPoupanca = selectedPrestacao ? movPoupança.reduce((sum, m) => sum + (m.tipo === "entrada" ? parseFloat(String(m.valor)) : -parseFloat(String(m.valor))), parseFloat(String(selectedPrestacao.saldoPoupanca || 0))) : 0;

  return (
    <div className="fade-in text-black">
      {/* ============ CABEÇALHO DA TELA (NÃO IMPRIME) ============ */}
      <div className="flex items-center justify-between mb-8 no-print">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Relatórios</h1>
          <p className="text-text-secondary mt-1">Gere relatórios para impressão</p>
        </div>
        {selectedId && (
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" />
            </svg>
            Imprimir Relatório
          </button>
        )}
      </div>

      {/* CONTROLES DE FILTRO (NÃO IMPRIME) */}
      <div className="glass-card rounded-2xl p-5 mb-6 no-print text-white">
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

      {/* ============ LAYOUT 1: IMPRESSÃO DE COBRANÇA MENSAL ============ */}
      {tipo === "cobranca" && selectedCobranca && (
        <div className="report-print-container class-cobranca-print bg-white p-6 border border-black">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold uppercase tracking-wider">Condomínio José Marcolini</h2>
            <h3 className="text-base font-semibold text-gray-700 mt-1 uppercase underline">
              RELATÓRIO DE TAXAS — {formatMesReferencia(selectedCobranca.mesReferencia)}
            </h3>
            <p className="text-xs text-gray-600 mt-1 font-mono">
              Vencimento original: {formatDate(selectedCobranca.dataVencimento)}
            </p>
          </div>

          <table className="w-full text-xs border-collapse border border-black text-black bg-white">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <th className="border border-black p-2 text-center">APTO</th>
                <th className="border border-black p-2 text-right">TAXA COND.</th>
                <th className="border border-black p-2 text-right">TAXA EXTRA</th>
                <th className="border border-black p-2 text-right">LEIT. ANT.</th>
                <th className="border border-black p-2 text-right">LEIT. ATUAL</th>
                <th className="border border-black p-2 text-right">CONSUMO</th>
                <th className="border border-black p-2 text-right">PREÇO M³</th>
                <th className="border border-black p-2 text-right">VALOR GÁS</th>
                <th className="border border-black p-2 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {selectedCobranca.itens.map((item) => (
                <tr key={item.id} className="border-b border-black">
                  <td className="border border-black p-1.5 font-bold text-center">{item.apartamento.numero}</td>
                  <td className="border border-black p-1.5 text-right">R$ {fmtNum(item.taxaCondominio)}</td>
                  <td className="border border-black p-1.5 text-right">R$ {fmtNum(item.taxaExtra)}</td>
                  <td className="border border-black p-1.5 text-right font-mono">{item.leituraAnteriorGas}</td>
                  <td className="border border-black p-1.5 text-right font-mono">{item.leituraAtualGas}</td>
                  <td className="border border-black p-1.5 text-right font-mono">{item.consumoGas}</td>
                  <td className="border border-black p-1.5 text-right">R$ {fmtNum(item.precoGasM3)}</td>
                  <td className="border border-black p-1.5 text-right">R$ {fmtNum(item.valorGas)}</td>
                  <td className="border border-black p-1.5 text-right font-bold">R$ {fmtNum(item.totalAPagar)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold border-t-2 border-black">
                <td className="border border-black p-2 text-center uppercase">Totais</td>
                <td className="border border-black p-2 text-right">R$ {fmtNum(selectedCobranca.totalTaxas)}</td>
                <td className="border border-black p-2 text-right">R$ {fmtNum(selectedCobranca.totalExtras)}</td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 text-right font-mono">{selectedCobranca.totalConsumoGas}</td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 text-right">R$ {fmtNum(selectedCobranca.totalGas)}</td>
                <td className="border border-black p-2 text-right text-base border-l-2">R$ {fmtNum(selectedCobranca.totalGeral)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ============ LAYOUT 2: IMPRESSÃO DE PRESTAÇÃO DE CONTAS (EXCEL FIEL) ============ */}
      {tipo === "prestacao" && selectedPrestacao && (
        <div className="report-print-container class-prestacao-print bg-white p-2">

          <div className="text-center mb-4">
            <h1 className="text-base font-bold tracking-widest uppercase">PRESTAÇÃO DE CONTAS</h1>
            <table style={{ margin: "10px auto 0 auto", borderCollapse: "collapse", border: "1px solid black", fontSize: "10pt" }}>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid black", padding: "3px 15px", fontWeight: "bold", background: "#f2f2f2" }}>MÊS:</td>
                  <td style={{ border: "1px solid black", padding: "3px 30px", fontWeight: "bold", textTransform: "uppercase" }}>{formatMesReferencia(selectedPrestacao.mesReferencia)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid black", fontSize: "9pt", backgroundColor: "white" }}>
            <thead>
              <tr style={{ fontWeight: "bold", textAlign: "center" }}>
                <th colSpan={2} style={{ border: "1px solid black", padding: "4px" }}>Receitas</th>
                <th colSpan={2} style={{ border: "1px solid black", padding: "4px" }}>DESPESAS</th>
              </tr>
              <tr style={{ fontWeight: "bold" }}>
                <th style={{ border: "1px solid black", padding: "4px", textAlign: "left", width: "35%" }}>DESCRIMINAÇÃO</th>
                <th style={{ border: "1px solid black", padding: "4px", textAlign: "right", width: "15%" }}>Valor</th>
                <th style={{ border: "1px solid black", padding: "4px", textAlign: "left", width: "35%" }}>DESCRIMINAÇÃO</th>
                <th style={{ border: "1px solid black", padding: "4px", textAlign: "right", width: "15%" }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid black", padding: "3px 6px" }}>SALDO MÊS ANTERIOR</td>
                <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>R$ {fmtNum(saldoAnterior)}</td>
                <td style={{ border: "1px solid black", padding: "3px 6px" }}>{selectedPrestacao.despesas[0]?.descricao.toUpperCase() || ""}</td>
                <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>{selectedPrestacao.despesas[0] ? `R$ ${fmtNum(selectedPrestacao.despesas[0].valor)}` : ""}</td>
              </tr>

              {Array.from({ length: Math.max(10, selectedPrestacao.receitas.length, selectedPrestacao.despesas.length - 1) }).map((_, index) => {
                const rItem = selectedPrestacao.receitas[index];
                const dItem = selectedPrestacao.despesas[index + 1];

                return (
                  <tr key={index}>
                    <td style={{ border: "1px solid black", padding: "3px 6px" }}>{rItem?.descricao.toUpperCase() || ""}</td>
                    <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>{rItem ? `R$ ${fmtNum(rItem.valor)}` : ""}</td>
                    <td style={{ border: "1px solid black", padding: "3px 6px" }}>{dItem?.descricao.toUpperCase() || ""}</td>
                    <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>{dItem ? `R$ ${fmtNum(dItem.valor)}` : ""}</td>
                  </tr>
                );
              })}

              <tr style={{ background: "#ffff00", fontWeight: "bold" }}>
                <td colSpan={2} style={{ border: "1px solid black", padding: "4px 6px" }}>CONDOMÍNIOS EM ATRASO</td>
                <td style={{ border: "1px solid black", background: "#ffffff" }}></td>
                <td style={{ border: "1px solid black", background: "#ffffff" }}></td>
              </tr>

              {Array.from({ length: Math.max(3, selectedPrestacao.atrasos?.length || 0) }).map((_, index) => {
                const aItem = selectedPrestacao.atrasos?.[index];
                return (
                  <tr key={`atraso-${index}`}>
                    <td style={{ border: "1px solid black", padding: "3px 6px", textTransform: "uppercase" }}>{aItem?.mesReferencia || ""}</td>
                    <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "left" }}>{aItem ? `R$ ${fmtNum(aItem.valor)}` : ""}</td>
                    <td style={{ border: "1px solid black" }}></td>
                    <td style={{ border: "1px solid black" }}></td>
                  </tr>
                );
              })}

              <tr style={{ background: "#ffff99", fontWeight: "bold" }}>
                <td style={{ border: "1px solid black", padding: "3px 6px" }}>TOTAL</td>
                <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "left" }}>R$ {fmtNum(totalAtrasos)}</td>
                <td style={{ border: "1px solid black", background: "#ffffff" }}></td>
                <td style={{ border: "1px solid black", background: "#ffffff" }}></td>
              </tr>

              <tr style={{ height: "15px" }}><td style={{ border: "1px solid black" }}></td><td style={{ border: "1px solid black" }}></td><td style={{ border: "1px solid black" }}></td><td style={{ border: "1px solid black" }}></td></tr>

              <tr style={{ fontWeight: "bold" }}>
                <td style={{ border: "1px solid black", padding: "4px 6px", textAlign: "center" }}>TOTAL</td>
                <td style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right" }}>R$ {fmtNum(totalReceitasPlanilha)}</td>
                <td style={{ border: "1px solid black", padding: "4px 6px", textAlign: "center" }}>TOTAL</td>
                <td style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right" }}>R$ {fmtNum(tDespesas)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "center", margin: "15px 0" }}>
            <table style={{ borderCollapse: "collapse", border: "1px solid black", fontWeight: "bold", fontSize: "10pt" }}>
              <tbody>
                <tr style={{ background: "#ffff00" }}>
                  <td style={{ border: "1px solid black", padding: "4px 20px" }}>CRÉDITO DO MÊS</td>
                  <td style={{ border: "1px solid black", padding: "4px 25px", textAlign: "right" }}>
                    {creditoMesCalculado >= 0 ? "" : "-"}R$ {fmtNum(Math.abs(creditoMesCalculado))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0px", border: "1px solid black", backgroundColor: "white", fontSize: "8pt" }}>

            <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid black" }}>
              <div style={{ background: "#d9d9d9", textAlign: "center", fontWeight: "bold", borderBottom: "1px solid black", padding: "3px" }}>RESERVA PARA O GÁS</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid black" }}>
                    <td style={{ padding: "3px 5px", borderRight: "1px solid black" }}>SALDO</td>
                    <td style={{ padding: "3px 5px", textAlign: "right" }}>R$ {fmtNum(selectedPrestacao.saldoReservaGas)}</td>
                  </tr>
                  {movGas.map((m: any) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid black" }}>
                      <td style={{ padding: "3px 5px", borderRight: "1px solid black", textTransform: "uppercase" }}>{m.descricao}</td>
                      <td style={{ padding: "3px 5px", textAlign: "right" }}>{m.tipo === "saida" ? "-" : ""}R$ {fmtNum(m.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop: "1px solid black", padding: "3px 5px", fontWeight: "bold", display: "flex", justifyContent: "space-between", fontSize: "9pt", marginTop: "auto" }}>
                <span style={{ textTransform: "uppercase" }}>{formatMesReferencia(selectedPrestacao.mesReferencia).split(" ")[0]}</span>
                <span>R$ {fmtNum(saldoFinalGas)}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid black" }}>
              <div style={{ background: "#d9d9d9", textAlign: "center", fontWeight: "bold", borderBottom: "1px solid black", padding: "3px" }}>CONTA CORRENTE</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid black" }}>
                    <td style={{ padding: "3px 5px", borderRight: "1px solid black", textTransform: "uppercase" }}>{formatMesReferencia(selectedPrestacao.mesReferencia).split(" ")[0]}</td>
                    <td style={{ padding: "3px 5px", textAlign: "right" }}>R$ {fmtNum(selectedPrestacao.saldoContaCorrente)}</td>
                  </tr>
                  {movCC.map((m: any) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid black" }}>
                      <td style={{ padding: "3px 5px", borderRight: "1px solid black", textTransform: "uppercase" }}>{m.descricao}</td>
                      <td style={{ padding: "3px 5px", textAlign: "right" }}>{m.tipo === "saida" ? "-" : ""}R$ {fmtNum(m.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop: "1px solid black", padding: "3px 5px", fontWeight: "bold", display: "flex", justifyContent: "space-between", fontSize: "9pt", marginTop: "auto" }}>
                <span style={{ textTransform: "uppercase" }}>{formatMesReferencia(selectedPrestacao.mesReferencia).split(" ")[0]}</span>
                <span>R$ {fmtNum(saldoFinalCC)}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ background: "#d9d9d9", textAlign: "center", fontWeight: "bold", borderBottom: "1px solid black", padding: "3px" }}>CONTA POUPANÇA</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid black" }}>
                    <td style={{ padding: "3px 5px", borderRight: "1px solid black" }}>MÊS ANTERIOR</td>
                    <td style={{ padding: "3px 5px", textAlign: "right" }}>R$ {fmtNum(selectedPrestacao.saldoPoupanca)}</td>
                  </tr>
                  {movPoupança.map((m: any) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid black" }}>
                      <td style={{ padding: "3px 5px", borderRight: "1px solid black", textTransform: "uppercase" }}>{m.descricao}</td>
                      <td style={{ padding: "3px 5px", textAlign: "right" }}>{m.tipo === "saida" ? "-" : ""}R$ {fmtNum(m.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop: "1px solid black", padding: "3px 5px", fontWeight: "bold", display: "flex", justifyContent: "space-between", fontSize: "9pt", marginTop: "auto" }}>
                <span style={{ textTransform: "uppercase" }}>{formatMesReferencia(selectedPrestacao.mesReferencia).split(" ")[0]}</span>
                <span>R$ {fmtNum(saldoFinalPoupanca)}</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TELA DE ESPERA / NENHUM RELATÓRIO SELECIONADO (NÃO IMPRIME) */}
      {!selectedId && (
        <div className="glass-card rounded-2xl p-12 text-center no-print">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-text-muted">
            <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="m7 17 4-8 4 4 4-6" />
          </svg>
          <p className="text-text-secondary text-lg">Selecione um período para gerar o relatório</p>
        </div>
      )}

      {/* ============ FOLHA DE ESTILOS CSS PARA IMPRESSÃO COMPATÍVEL ============ */}
      <style jsx global>{`
        @media print {
          .no-print, .screen-only { 
            display: none !important; 
          }
          body { 
            background: white !important; 
            color: black !important; 
            padding: 0 !important; 
            margin: 0 !important; 
          }
          .glass-card {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          .report-print-container {
            display: block !important;
            width: 100% !important;
            max-width: 790px !important;
            margin: 0 auto !important;
          }
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          table, th, td, div {
            border-color: #000000 !important;
          }
        }
      `}</style>
    </div>
  );
}