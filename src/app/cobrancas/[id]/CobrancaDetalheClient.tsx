"use client";

import { useState, useTransition } from "react";
import { updateCobrancaItem, marcarPago, updateDataVencimento } from "@/lib/actions/cobrancas";
import { formatCurrency, formatMesReferencia, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CobrancaItem {
  id: number;
  apartamento: { id: number; numero: string };
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
  dataPagamento: string | null;
}

interface Cobranca {
  id: number;
  mesReferencia: string;
  dataVencimento: string;
  taxaCondominioPadrao: number;
  taxaExtraPadrao: number;
  precoGasM3Padrao: number;
  observacoes: string | null;
  status: string;
  condominio: {
    nome: string;
    cnpjPix: string;
    textoPadraoCobranca: string | null;
    textoPadraoFundoObras: string | null;
  };
  itens: CobrancaItem[];
  totalGeral: number;
  totalPago: number;
  totalTaxas: number;
  totalExtras: number;
  totalGas: number;
  totalConsumoGas: number;
}

// Helper to format number with comma as decimal separator for print
function fmtNum(value: number, decimals = 2): string {
  return value.toFixed(decimals).replace(".", ",");
}

export default function CobrancaDetalheClient({ cobranca }: { cobranca: Cobranca }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [payModal, setPayModal] = useState<CobrancaItem | null>(null);
  const [editModal, setEditModal] = useState<CobrancaItem | null>(null);

  const handleLeituraChange = (itemId: number, value: string) => {
    const leitura = parseFloat(value);
    if (isNaN(leitura)) return;

    startTransition(async () => {
      await updateCobrancaItem(itemId, { leituraAtualGas: leitura });
      router.refresh();
    });
  };

  const handleMarcarPago = async (formData: FormData) => {
    if (!payModal) return;
    const valor = parseFloat(formData.get("valorPago") as string);
    const data = formData.get("dataPagamento") as string;

    startTransition(async () => {
      await marcarPago(payModal.id, valor, data);
      setPayModal(null);
      router.refresh();
    });
  };

  const handleEditarPagamento = async (formData: FormData) => {
    if (!editModal) return;
    const status = formData.get("statusPagamento") as string;
    const valor = parseFloat(formData.get("valorPago") as string);
    const data = formData.get("dataPagamento") as string;

    startTransition(async () => {
      if (status === "pendente") {
        await marcarPago(editModal.id, 0, "");
      } else {
        await marcarPago(editModal.id, valor, data);
      }
      setEditModal(null);
      router.refresh();
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <span className="badge badge-success">Pago</span>;
      case "pago_parcial":
        return <span className="badge badge-warning">Parcial</span>;
      default:
        return <span className="badge badge-danger">Pendente</span>;
    }
  };

  const mesNome = formatMesReferencia(cobranca.mesReferencia).toUpperCase();

  return (
    <div className="fade-in">
      {/* ============ PRINT LAYOUT ============ */}
      <div className="print-layout">
        <table className="print-table">
          {/* Header */}
          <thead>
            <tr>
              <th colSpan={9} className="print-title">
                {cobranca.condominio.nome.toUpperCase()}
              </th>
            </tr>
            <tr>
              <th colSpan={9} className="print-subtitle">
                MÊS: {mesNome}
              </th>
            </tr>
            <tr>
              <th rowSpan={2} className="print-th">APTOS</th>
              <th rowSpan={2} className="print-th">TAXA DE<br />CONDOMÍNIO</th>
              <th rowSpan={2} className="print-th">TAXA<br />EXTRA</th>
              <th colSpan={5} className="print-th print-th-gas">GÁS</th>
              <th rowSpan={2} className="print-th">TOTAL GERAL<br />A PAGAR</th>
            </tr>
            <tr>
              <th className="print-th">LEITURA ANTERIOR</th>
              <th className="print-th">LEITURA ATUAL</th>
              <th className="print-th">Consumo</th>
              <th className="print-th">PREÇO P/ M³</th>
              <th className="print-th">VALOR DO GÁS</th>
            </tr>
          </thead>
          <tbody>
            {cobranca.itens.map((item) => (
              <tr key={item.id}>
                <td className="print-td print-td-center">{item.apartamento.numero}</td>
                <td className="print-td print-td-right">{fmtNum(item.taxaCondominio)}</td>
                <td className="print-td print-td-right">{fmtNum(item.taxaExtra)}</td>
                <td className="print-td print-td-right">{item.leituraAnteriorGas}</td>
                <td className="print-td print-td-right">{item.leituraAtualGas}</td>
                <td className="print-td print-td-center">{item.consumoGas}</td>
                <td className="print-td print-td-right">{fmtNum(item.precoGasM3)}</td>
                <td className="print-td print-td-right">R$ {fmtNum(item.valorGas)}</td>
                <td className="print-td print-td-right">R$ {fmtNum(item.totalAPagar)}</td>
              </tr>
            ))}
            {/* Totais */}
            <tr className="print-totais">
              <td className="print-td print-td-bold">TOTAIS</td>
              <td className="print-td print-td-right print-td-bold">{fmtNum(cobranca.totalTaxas)}</td>
              <td className="print-td print-td-right print-td-bold">{fmtNum(cobranca.totalExtras)}</td>
              <td className="print-td"></td>
              <td className="print-td"></td>
              <td className="print-td print-td-center print-td-bold">{cobranca.totalConsumoGas}</td>
              <td className="print-td"></td>
              <td className="print-td print-td-right print-td-bold">R$ {fmtNum(cobranca.totalGas)}</td>
              <td className="print-td print-td-right print-td-bold">R$ {fmtNum(cobranca.totalGeral)}</td>
            </tr>
          </tbody>
        </table>

        {/* Observações */}
        <div className="print-obs">
          <p>
            <strong>OBS: &nbsp; FAZER O DEPÓSITO NA CONTA DO CONDOMÍNIO ATÉ DIA &nbsp;&nbsp; {formatDate(cobranca.dataVencimento)}</strong>
          </p>
          <p>
            <strong>PIX CNPJ DO CONDOMÍNIO</strong>
          </p>
        </div>

        {cobranca.condominio.textoPadraoFundoObras && (
          <div className="print-fundo-obras">
            <p>
              O pagamento dos <strong>R$100,00</strong>, referente ao fundo de obras(dos proprietários), deverá ser feito na conta do
              condomínio até o <strong>dia 10 de cada mês</strong>.
            </p>
          </div>
        )}

        {/* Assinatura */}
        <div className="print-assinatura">
          <div className="print-linha-assinatura"></div>
          <p><strong>A SÍNDICA</strong></p>
        </div>
      </div>

      {/* ============ SCREEN LAYOUT ============ */}
      <div className="screen-only">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/cobrancas" className="text-text-muted hover:text-text-primary transition-colors">
                ← Cobranças
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              Cobrança — {formatMesReferencia(cobranca.mesReferencia)}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Vencimento:</span>
                <input
                  type="date"
                  defaultValue={cobranca.dataVencimento}
                  onBlur={(e) => {
                    if (e.target.value && e.target.value !== cobranca.dataVencimento) {
                      startTransition(async () => {
                        await updateDataVencimento(cobranca.id, e.target.value);
                        router.refresh();
                      });
                    }
                  }}
                  className="input-field py-1 px-2 text-sm w-40"
                />
              </div>
              <span className="text-text-secondary">Gás: {formatCurrency(cobranca.precoGasM3Padrao)}/m³</span>
            </div>
          </div>
          <button onClick={() => window.print()} className="btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" />
            </svg>
            Imprimir
          </button>
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Apto</th>
                  <th className="text-right">Taxa Cond.</th>
                  <th className="text-right">Taxa Extra</th>
                  <th className="text-right">Leit. Anterior</th>
                  <th className="text-right">Leit. Atual</th>
                  <th className="text-right">Consumo</th>
                  <th className="text-right">Preço m³</th>
                  <th className="text-right">Valor Gás</th>
                  <th className="text-right">Total</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cobranca.itens.map((item, index) => (
                  <tr key={item.id}>
                    <td className="font-semibold">{item.apartamento.numero}</td>
                    <td className="text-right">{formatCurrency(item.taxaCondominio)}</td>
                    <td className="text-right">{formatCurrency(item.taxaExtra)}</td>
                    <td className="text-right text-text-secondary">
                      {item.leituraAnteriorGas}
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        defaultValue={item.leituraAtualGas}
                        onBlur={(e) => handleLeituraChange(item.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                            const nextInput = document.querySelector(
                              `input[data-leitura-index="${index + 1}"]`
                            ) as HTMLInputElement | null;
                            if (nextInput) {
                              setTimeout(() => {
                                nextInput.focus();
                                nextInput.select();
                              }, 50);
                            }
                          }
                        }}
                        data-leitura-index={index}
                        className="input-field w-24 text-right py-1 text-sm"
                        min={item.leituraAnteriorGas}
                        step="1"
                      />
                    </td>
                    <td className="text-right">{item.consumoGas}</td>
                    <td className="text-right text-text-secondary">
                      {formatCurrency(item.precoGasM3)}
                    </td>
                    <td className="text-right">{formatCurrency(item.valorGas)}</td>
                    <td className="text-right font-semibold text-primary-300">
                      {formatCurrency(item.totalAPagar)}
                    </td>
                    <td className="text-center">{statusBadge(item.statusPagamento)}</td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        {item.statusPagamento !== "pago" && (
                          <button
                            onClick={() => setPayModal(item)}
                            className="btn-success text-xs py-1.5 px-3"
                          >
                            Pagar
                          </button>
                        )}
                        {item.statusPagamento !== "pendente" && (
                          <button
                            onClick={() => setEditModal(item)}
                            className="btn-secondary text-xs py-1.5 px-3"
                            title="Editar pagamento"
                          >
                            ✏️ Editar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="font-bold">Totais</td>
                  <td className="text-right">{formatCurrency(cobranca.totalTaxas)}</td>
                  <td className="text-right">{formatCurrency(cobranca.totalExtras)}</td>
                  <td></td>
                  <td></td>
                  <td className="text-right">{cobranca.totalConsumoGas}</td>
                  <td></td>
                  <td className="text-right">{formatCurrency(cobranca.totalGas)}</td>
                  <td className="text-right text-primary-300 text-base">
                    {formatCurrency(cobranca.totalGeral)}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-text-secondary">Total Previsto</p>
            <p className="text-lg font-bold text-primary-400">{formatCurrency(cobranca.totalGeral)}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-text-secondary">Total Recebido</p>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(cobranca.totalPago)}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-text-secondary">Consumo Gás Total</p>
            <p className="text-lg font-bold text-blue-400">{cobranca.totalConsumoGas} m³</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-text-secondary">Pendente</p>
            <p className="text-lg font-bold text-red-400">
              {formatCurrency(cobranca.totalGeral - cobranca.totalPago)}
            </p>
          </div>
        </div>

        {/* Observations */}
        {cobranca.observacoes && (
          <div className="glass-card rounded-2xl p-5 mt-4">
            <h3 className="font-semibold text-sm text-text-secondary mb-2">Observações</h3>
            <p className="text-text-primary whitespace-pre-wrap">{cobranca.observacoes}</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div className="modal-overlay no-print" onClick={() => setPayModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">
              Registrar Pagamento — Apto {payModal.apartamento.numero}
            </h2>
            <p className="text-text-secondary mb-4">
              Total a pagar: <span className="text-primary-400 font-semibold">{formatCurrency(payModal.totalAPagar)}</span>
              {payModal.valorPago > 0 && (
                <span className="ml-2">(já pago: {formatCurrency(payModal.valorPago)})</span>
              )}
            </p>
            <form action={handleMarcarPago} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Valor Pago (R$) *</label>
                <input
                  type="number"
                  name="valorPago"
                  required
                  step="0.01"
                  min="0"
                  className="input-field"
                  defaultValue={payModal.totalAPagar - payModal.valorPago}
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
                  {isPending ? "Registrando..." : "Confirmar Pagamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {editModal && (
        <div className="modal-overlay no-print" onClick={() => setEditModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">
              Editar Pagamento — Apto {editModal.apartamento.numero}
            </h2>
            <p className="text-text-secondary mb-4">
              Total a pagar: <span className="text-primary-400 font-semibold">{formatCurrency(editModal.totalAPagar)}</span>
            </p>
            <form action={handleEditarPagamento} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Status do Pagamento *</label>
                <select
                  name="statusPagamento"
                  className="input-field"
                  defaultValue={editModal.statusPagamento}
                  onChange={(e) => {
                    const form = e.target.closest('form');
                    const valorInput = form?.querySelector('input[name="valorPago"]') as HTMLInputElement;
                    const dataInput = form?.querySelector('input[name="dataPagamento"]') as HTMLInputElement;
                    if (e.target.value === 'pendente') {
                      valorInput.value = '0';
                      valorInput.disabled = true;
                      dataInput.disabled = true;
                    } else {
                      valorInput.disabled = false;
                      dataInput.disabled = false;
                      if (e.target.value === 'pago') {
                        valorInput.value = String(editModal.totalAPagar);
                      }
                    }
                  }}
                >
                  <option value="pago">Pago</option>
                  <option value="pago_parcial">Pago Parcial</option>
                  <option value="pendente">Pendente (Não Pago)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Valor Pago (R$) *</label>
                <input
                  type="number"
                  name="valorPago"
                  required
                  step="0.01"
                  min="0"
                  className="input-field"
                  defaultValue={editModal.valorPago}
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Data do Pagamento *</label>
                <input
                  type="date"
                  name="dataPagamento"
                  required
                  className="input-field"
                  defaultValue={editModal.dataPagamento || new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEditModal(null)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
