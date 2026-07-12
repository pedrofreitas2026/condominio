"use client";

import { useState, useTransition } from "react";
import { addReceita, addDespesa, deleteReceita, deleteDespesa, addMovimentacao, updateReceita, updateDespesa, deleteMovimentacao, updateMovimentacao, deletePrestacao, addAtraso, updateAtraso, deleteAtraso } from "@/lib/actions/prestacao";
import { formatMesReferencia } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Receita {
  id: number;
  descricao: string;
  valor: number;
  origem: string;
}

interface Despesa {
  id: number;
  descricao: string;
  categoria: string | null;
  valor: number;
  dataPagamento: string | null;
}

interface Movimentacao {
  id: number;
  conta: string;
  descricao: string;
  valor: number;
  tipo: string;
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
  status: string;
  condominio: {
    nome: string;
    cnpjPix: string;
    responsavel: string | null;
  };
  receitas: Receita[];
  despesas: Despesa[];
  movimentacoes: Movimentacao[];
  atrasos: Atraso[];
}

export default function PrestacaoDetalheClient({ prestacao }: { prestacao: Prestacao }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDeletePrestacao = () => {
    if (!confirm("Tem certeza que deseja excluir esta prestação de contas? Todas as receitas, despesas e movimentações associadas serão excluídas permanentemente.")) return;
    startTransition(async () => {
      await deletePrestacao(prestacao.id);
      router.push("/prestacao");
    });
  };

  const [showReceitaForm, setShowReceitaForm] = useState(false);
  const [showDespesaForm, setShowDespesaForm] = useState(false);
  const [showMovForm, setShowMovForm] = useState(false);
  const [showAtrasoForm, setShowAtrasoForm] = useState(false);
  const [editReceita, setEditReceita] = useState<Receita | null>(null);
  const [editDespesa, setEditDespesa] = useState<Despesa | null>(null);
  const [editMov, setEditMov] = useState<Movimentacao | null>(null);
  const [editAtraso, setEditAtraso] = useState<Atraso | null>(null);

  // Correção profunda do reduce para evitar concatenações de string no totalizador
  const totalAtrasos = prestacao.atrasos?.reduce((sum, a) => {
    const valorItem = parseFloat(String(a.valor || 0));
    const acumuladorParcial = parseFloat(String(sum));
    return acumuladorParcial + valorItem;
  }, 0) ?? 0;

  const saldoAcumulado = [
    prestacao.saldoContaCorrente,
    prestacao.saldoPoupanca,
  ].reduce((total, saldo) => total + parseFloat(String(saldo ?? 0)), 0);

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

  const handleAddReceita = async (formData: FormData) => {
    startTransition(async () => {
      await addReceita(prestacao.id, formData);
      setShowReceitaForm(false);
      router.refresh();
    });
  };

  const handleAddDespesa = async (formData: FormData) => {
    startTransition(async () => {
      await addDespesa(prestacao.id, formData);
      setShowDespesaForm(false);
      router.refresh();
    });
  };

  const handleDeleteReceita = (id: number) => {
    if (!confirm("Remover esta receita?")) return;
    startTransition(async () => {
      await deleteReceita(id, prestacao.id);
      router.refresh();
    });
  };

  const handleDeleteDespesa = (id: number) => {
    if (!confirm("Remover esta despesa?")) return;
    startTransition(async () => {
      await deleteDespesa(id, prestacao.id);
      router.refresh();
    });
  };

  const handleEditReceita = async (formData: FormData) => {
    if (!editReceita) return;
    startTransition(async () => {
      await updateReceita(editReceita.id, prestacao.id, formData);
      setEditReceita(null);
      router.refresh();
    });
  };

  const handleEditDespesa = async (formData: FormData) => {
    if (!editDespesa) return;
    startTransition(async () => {
      await updateDespesa(editDespesa.id, prestacao.id, formData);
      setEditDespesa(null);
      router.refresh();
    });
  };

  const handleAddMov = async (formData: FormData) => {
    startTransition(async () => {
      await addMovimentacao(prestacao.id, formData);
      setShowMovForm(false);
      router.refresh();
    });
  };

  const handleDeleteMov = (id: number) => {
    if (!confirm("Remover esta movimentação?")) return;
    startTransition(async () => {
      await deleteMovimentacao(id, prestacao.id);
      router.refresh();
    });
  };

  const handleEditMov = async (formData: FormData) => {
    if (!editMov) return;
    startTransition(async () => {
      await updateMovimentacao(editMov.id, prestacao.id, formData);
      setEditMov(null);
      router.refresh();
    });
  };

  const handleAddAtraso = async (formData: FormData) => {
    startTransition(async () => {
      await addAtraso(prestacao.id, formData);
      setShowAtrasoForm(false);
      router.refresh();
    });
  };

  const handleEditAtraso = async (formData: FormData) => {
    if (!editAtraso) return;
    startTransition(async () => {
      await updateAtraso(editAtraso.id, prestacao.id, formData);
      setEditAtraso(null);
      router.refresh();
    });
  };

  const handleDeleteAtraso = (id: number) => {
    if (!confirm("Remover este atraso?")) return;
    startTransition(async () => {
      await deleteAtraso(id, prestacao.id);
      router.refresh();
    });
  };

  const contaLabel: Record<string, string> = {
    reserva_gas: "Reserva p/ Gás",
    conta_corrente: "Conta Corrente",
    poupanca: "Poupança",
  };

  return (
    <div className="fade-in">
      {/* ============ PRINT LAYOUT ============ */}
      <div className="print-layout">
        <div style={{ textAlign: "center", marginBottom: "15px" }}>
          <h1 style={{ fontSize: "16pt", fontWeight: "bold", margin: "0", border: "2px solid #333", padding: "8px", background: "#f0f0f0" }}>
            {prestacao.condominio.nome.toUpperCase()}
          </h1>
          <h2 style={{ fontSize: "12pt", fontWeight: "bold", margin: "0", border: "2px solid #000", borderTop: "none", padding: "6px" }}>
            DEMONSTRATIVO DE PRESTAÇÃO DE CONTAS — MÊS: {formatMesReferencia(prestacao.mesReferencia).toUpperCase()}
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", alignItems: "start" }}>

          {/* Coluna 1: Receitas e Abaixo os Condomínios em Atraso */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div>
              <h3 style={{ fontSize: "10pt", fontWeight: "bold", margin: "0 0 6px 0", borderBottom: "2px solid #333", paddingBottom: "2px" }}>
                RECEITAS
              </h3>
              <table className="print-table">
                <thead>
                  <tr>
                    <th className="print-th" style={{ textAlign: "left" }}>DESCRIÇÃO</th>
                    <th className="print-th" style={{ textAlign: "right", width: "90px" }}>VALOR</th>
                  </tr>
                </thead>
                <tbody>
                  {prestacao.receitas.map((r) => (
                    <tr key={r.id}>
                      <td className="print-td">{r.descricao}</td>
                      <td className="print-td print-td-right">R$ {fmtNum(r.valor)}</td>
                    </tr>
                  ))}
                  <tr className="print-totais">
                    <td className="print-td print-td-bold">TOTAL RECEITAS</td>
                    <td className="print-td print-td-right print-td-bold">R$ {fmtNum(prestacao.totalReceitas)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Condomínios em Atraso reposicionados para debaixo de Receitas */}
            {prestacao.atrasos && prestacao.atrasos.length > 0 && (
              <div>
                <h3 style={{ fontSize: "10pt", fontWeight: "bold", margin: "0 0 6px 0", borderBottom: "2px solid #333", paddingBottom: "2px" }}>
                  CONDOMÍNIOS EM ATRASO
                </h3>
                <table className="print-table">
                  <tbody>
                    {prestacao.atrasos.map((item) => (
                      <tr key={item.id}>
                        <td className="print-td" style={{ textTransform: "uppercase" }}>{item.mesReferencia}</td>
                        <td className="print-td print-td-right">R$ {fmtNum(item.valor)}</td>
                      </tr>
                    ))}
                    <tr className="print-totais">
                      <td className="print-td print-td-bold">TOTAL</td>
                      <td className="print-td print-td-right print-td-bold">R$ {fmtNum(totalAtrasos)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Coluna 2: Despesas */}
          <div>
            <h3 style={{ fontSize: "10pt", fontWeight: "bold", margin: "0 0 6px 0", borderBottom: "2px solid #333", paddingBottom: "2px" }}>
              DESPESAS
            </h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th className="print-th" style={{ textAlign: "left" }}>DESCRIÇÃO</th>
                  <th className="print-th" style={{ textAlign: "right", width: "90px" }}>VALOR</th>
                </tr>
              </thead>
              <tbody>
                {prestacao.despesas.map((d) => (
                  <tr key={d.id}>
                    <td className="print-td">
                      {d.descricao}
                      {d.categoria && <span style={{ fontSize: "7px", border: "1px solid #999", padding: "1px 2px", borderRadius: "3px", marginLeft: "4px", textTransform: "uppercase" }}>{d.categoria}</span>}
                    </td>
                    <td className="print-td print-td-right">R$ {fmtNum(d.valor)}</td>
                  </tr>
                ))}
                <tr className="print-totais">
                  <td className="print-td print-td-bold">TOTAL DESPESAS</td>
                  <td className="print-td print-td-right print-td-bold">R$ {fmtNum(prestacao.totalDespesas)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Coluna 3: Resumo Financeiro, Reserva do Gás e Saldos das Contas agrupados */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div>
              <h3 style={{ fontSize: "10pt", fontWeight: "bold", margin: "0 0 6px 0", borderBottom: "2px solid #333", paddingBottom: "2px" }}>
                RESUMO FINANCEIRO DO MÊS
              </h3>
              <table className="print-table">
                <tbody>
                  <tr>
                    <td className="print-td">(+) Receitas do Mês</td>
                    <td className="print-td print-td-right">R$ {fmtNum(prestacao.totalReceitas)}</td>
                  </tr>
                  <tr>
                    <td className="print-td">(-) Despesas do Mês</td>
                    <td className="print-td print-td-right">R$ {fmtNum(prestacao.totalDespesas)}</td>
                  </tr>
                  <tr className="print-totais">
                    <td className="print-td print-td-bold">(=) CRÉDITO DO MÊS</td>
                    <td className="print-td print-td-right print-td-bold" style={{ color: (prestacao.totalReceitas - prestacao.totalDespesas) >= 0 ? "green" : "red" }}>
                      R$ {fmtNum(prestacao.totalReceitas - prestacao.totalDespesas)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 style={{ fontSize: "10pt", fontWeight: "bold", margin: "0 0 6px 0", borderBottom: "2px solid #333", paddingBottom: "2px" }}>
                RESERVA GÁS
              </h3>
              <table className="print-table">
                <tbody>
                  <tr>
                    <td className="print-td">Reserva para Gás</td>
                    <td className="print-td print-td-right">R$ {fmtNum(prestacao.saldoReservaGas)}</td>
                  </tr>
                  <tr className="print-totais">
                    <td className="print-td print-td-bold">TOTAL RESERVA GÁS</td>
                    <td className="print-td print-td-right print-td-bold">
                      R$ {fmtNum(prestacao.saldoReservaGas)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ fontSize: "10pt", fontWeight: "bold", margin: "0 0 6px 0", borderBottom: "2px solid #333", paddingBottom: "2px" }}>
                SALDOS DAS CONTAS
              </h3>
              <table className="print-table">
                <tbody>
                  <tr>
                    <td className="print-td">Conta Corrente</td>
                    <td className="print-td print-td-right">R$ {fmtNum(prestacao.saldoContaCorrente)}</td>
                  </tr>
                  <tr>
                    <td className="print-td">Poupança</td>
                    <td className="print-td print-td-right">R$ {fmtNum(prestacao.saldoPoupanca)}</td>
                  </tr>
                  <tr className="print-totais">
                    <td className="print-td print-td-bold">SALDO ACUMULADO</td>
                    <td className="print-td print-td-right print-td-bold">
                      R$ {fmtNum(saldoAcumulado)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* ============ SCREEN LAYOUT ============ */}
      <div className="screen-only">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/prestacao" className="text-text-muted hover:text-text-primary transition-colors">
                ← Prestação de Contas
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              {formatMesReferencia(prestacao.mesReferencia)}
            </h1>
          </div>
          <div className="flex gap-2 items-center no-print">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm text-sm"
            >
              🖨️ Imprimir Planilha
            </button>
            <button onClick={handleDeletePrestacao} className="btn-danger flex items-center gap-1.5" disabled={isPending}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              {isPending ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-text-secondary">Total Receitas</p>
            <p className="text-xl font-bold text-emerald-400">{formatCurrency(prestacao.totalReceitas)}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-text-secondary">Total Despesas</p>
            <p className="text-xl font-bold text-red-400">{formatCurrency(prestacao.totalDespesas)}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-text-secondary">Crédito do Mês</p>
            <p className={`text-xl font-bold ${(prestacao.totalReceitas - prestacao.totalDespesas) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatCurrency(prestacao.totalReceitas - prestacao.totalDespesas)}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-text-secondary">Saldo Mês Anterior</p>
            <p className="text-xl font-bold text-blue-400">{formatCurrency(prestacao.saldoMesAnterior)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Receitas */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Receitas</h2>
              <button onClick={() => setShowReceitaForm(!showReceitaForm)} className="btn-primary text-xs py-1.5 no-print">
                + Receita
              </button>
            </div>

            {showReceitaForm && (
              <form action={handleAddReceita} className="mb-4 p-3 bg-surface rounded-xl space-y-3 no-print">
                <input name="descricao" required className="input-field" placeholder="Descrição" />
                <input name="valor" type="number" required step="0.01" className="input-field" placeholder="Valor (R$)" />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowReceitaForm(false)} className="btn-secondary text-xs">Cancelar</button>
                  <button type="submit" className="btn-primary text-xs" disabled={isPending}>Adicionar</button>
                </div>
              </form>
            )}

            <table className="data-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th className="text-right">Valor</th>
                  <th className="text-center no-print">Ações</th>
                </tr>
              </thead>
              <tbody>
                {prestacao.receitas.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.descricao}
                      {r.origem === "cobranca" && <span className="badge badge-info ml-2 text-[10px]">Auto</span>}
                    </td>
                    <td className="text-right text-emerald-400">{formatCurrency(r.valor)}</td>
                    <td className="text-center no-print">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => setEditReceita(r)} className="text-primary-400 hover:text-primary-300 text-xs" title="Editar">
                          ✏️
                        </button>
                        <button onClick={() => handleDeleteReceita(r.id)} className="text-red-400 hover:text-red-300 text-xs" title="Excluir">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="font-bold">Total</td>
                  <td className="text-right text-black font-bold">{formatCurrency(prestacao.totalReceitas)}</td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Despesas */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Despesas</h2>
              <button onClick={() => setShowDespesaForm(!showDespesaForm)} className="btn-primary text-xs py-1.5 no-print">
                + Despesa
              </button>
            </div>

            {showDespesaForm && (
              <form action={handleAddDespesa} className="mb-4 p-3 bg-surface rounded-xl space-y-3 no-print">
                <input name="descricao" required className="input-field" placeholder="Descrição (ex: CEMIG)" />
                <div className="grid grid-cols-2 gap-2">
                  <input name="valor" type="number" required step="0.01" className="input-field" placeholder="Valor (R$)" />
                  <select name="categoria" className="input-field">
                    <option value="">Categoria</option>
                    <option value="energia">Energia</option>
                    <option value="agua">Água</option>
                    <option value="servico">Serviço</option>
                    <option value="banco">Banco</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <input name="dataPagamento" type="date" className="input-field" />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowDespesaForm(false)} className="btn-secondary text-xs">Cancelar</button>
                  <button type="submit" className="btn-primary text-xs" disabled={isPending}>Adicionar</button>
                </div>
              </form>
            )}

            <table className="data-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th className="text-right">Valor</th>
                  <th className="text-center no-print">Ações</th>
                </tr>
              </thead>
              <tbody>
                {prestacao.despesas.map((d) => (
                  <tr key={d.id}>
                    <td>
                      {d.descricao}
                      {d.categoria && <span className="badge badge-info ml-2 text-[10px]">{d.categoria}</span>}
                    </td>
                    <td className="text-right text-red-400">{formatCurrency(d.valor)}</td>
                    <td className="text-center no-print">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => setEditDespesa(d)} className="text-primary-400 hover:text-primary-300 text-xs" title="Editar">
                          ✏️
                        </button>
                        <button onClick={() => handleDeleteDespesa(d.id)} className="text-red-400 hover:text-red-300 text-xs" title="Excluir">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="font-bold">Total</td>
                  <td className="text-right text-red-400 font-bold">{formatCurrency(prestacao.totalDespesas)}</td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Edit Receita Modal */}
        {editReceita && (
          <div className="modal-overlay no-print" onClick={() => setEditReceita(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">Editar Receita</h2>
              <form action={handleEditReceita} className="space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Descrição *</label>
                  <input name="descricao" required className="input-field" defaultValue={editReceita.descricao} />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Valor (R$) *</label>
                  <input name="valor" type="number" required step="0.01" className="input-field" defaultValue={editReceita.valor} />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setEditReceita(null)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Despesa Modal */}
        {editDespesa && (
          <div className="modal-overlay no-print" onClick={() => setEditDespesa(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">Editar Despesa</h2>
              <form action={handleEditDespesa} className="space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Descrição *</label>
                  <input name="descricao" required className="input-field" defaultValue={editDespesa.descricao} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Valor (R$) *</label>
                    <input name="valor" type="number" required step="0.01" className="input-field" defaultValue={editDespesa.valor} />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Categoria</label>
                    <select name="categoria" className="input-field" defaultValue={editDespesa.categoria || ""}>
                      <option value="">Nenhuma</option>
                      <option value="energia">Energia</option>
                      <option value="agua">Água</option>
                      <option value="servico">Serviço</option>
                      <option value="banco">Banco</option>
                      <option value="manutencao">Manutenção</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Data do Pagamento</label>
                  <input name="dataPagamento" type="date" className="input-field" defaultValue={editDespesa.dataPagamento || ""} />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setEditDespesa(null)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Movimentação Modal */}
        {editMov && (
          <div className="modal-overlay no-print" onClick={() => setEditMov(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">Editar Movimentação</h2>
              <form action={handleEditMov} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Conta *</label>
                    <select name="conta" required className="input-field" defaultValue={editMov.conta}>
                      <option value="reserva_gas">Reserva p/ Gás</option>
                      <option value="conta_corrente">Conta Corrente</option>
                      <option value="poupanca">Poupança</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Tipo *</label>
                    <select name="tipo" required className="input-field" defaultValue={editMov.tipo}>
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Valor (R$) *</label>
                  <input name="valor" type="number" required step="0.01" min="0" className="input-field" defaultValue={editMov.valor} />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Descrição *</label>
                  <input name="descricao" required className="input-field" defaultValue={editMov.descricao} />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setEditMov(null)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Account Balances */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Saldos das Contas</h2>
            <button onClick={() => setShowMovForm(!showMovForm)} className="btn-secondary text-xs py-1.5 no-print">
              + Movimentação
            </button>
          </div>

          {showMovForm && (
            <form action={handleAddMov} className="mb-4 p-3 bg-surface rounded-xl space-y-3 no-print">
              <div className="grid grid-cols-3 gap-2">
                <select name="conta" required className="input-field">
                  <option value="">Conta</option>
                  <option value="reserva_gas">Reserva p/ Gás</option>
                  <option value="conta_corrente">Conta Corrente</option>
                  <option value="poupanca">Poupança</option>
                </select>
                <select name="tipo" required className="input-field">
                  <option value="">Tipo</option>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
                <input name="valor" type="number" required step="0.01" min="0" className="input-field" placeholder="Valor" />
              </div>
              <input name="descricao" required className="input-field" placeholder="Descrição" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowMovForm(false)} className="btn-secondary text-xs">Cancelar</button>
                <button type="submit" className="btn-primary text-xs" disabled={isPending}>Adicionar</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-surface rounded-xl p-4 border border-border">
              <p className="text-sm text-text-secondary mb-1">Reserva para Gás</p>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(prestacao.saldoReservaGas)}</p>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-border">
              <p className="text-sm text-text-secondary mb-1">Conta Corrente</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(prestacao.saldoContaCorrente)}</p>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-border">
              <p className="text-sm text-text-secondary mb-1">Poupança</p>
              <p className="text-xl font-bold text-purple-400">{formatCurrency(prestacao.saldoPoupanca)}</p>
            </div>
          </div>

          {/* Movimentações list */}
          {prestacao.movimentacoes.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Conta</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th className="text-right">Valor</th>
                  <th className="text-center no-print">Ações</th>
                </tr>
              </thead>
              <tbody>
                {prestacao.movimentacoes.map((m) => (
                  <tr key={m.id}>
                    <td>{contaLabel[m.conta] || m.conta}</td>
                    <td>{m.descricao}</td>
                    <td>
                      <span className={`badge ${m.tipo === "entrada" ? "badge-success" : "badge-danger"}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className={`text-right ${m.tipo === "entrada" ? "text-emerald-400" : "text-red-400"}`}>
                      {formatCurrency(m.valor)}
                    </td>
                    <td className="text-center no-print">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => setEditMov(m)} className="text-primary-400 hover:text-primary-300 text-xs" title="Editar">
                          ✏️
                        </button>
                        <button onClick={() => handleDeleteMov(m.id)} className="text-red-400 hover:text-red-300 text-xs" title="Excluir">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Condomínios em Atraso */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Condomínios em Atraso</h2>
            <button onClick={() => setShowAtrasoForm(!showAtrasoForm)} className="btn-primary text-xs py-1.5 no-print">
              + Atraso
            </button>
          </div>

          {showAtrasoForm && (
            <form action={handleAddAtraso} className="mb-4 p-3 bg-surface rounded-xl space-y-3 no-print">
              <div className="grid grid-cols-2 gap-2">
                <input name="mesReferencia" required className="input-field" placeholder="Mês (ex: MAIO)" />
                <input name="valor" type="number" required step="0.01" className="input-field" placeholder="Valor (R$)" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAtrasoForm(false)} className="btn-secondary text-xs">Cancelar</button>
                <button type="submit" className="btn-primary text-xs" disabled={isPending}>Adicionar</button>
              </div>
            </form>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Mês de Referência</th>
                <th className="text-right">Valor em Aberto</th>
                <th className="text-center no-print" style={{ width: "100px" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {prestacao.atrasos && prestacao.atrasos.length > 0 ? (
                prestacao.atrasos.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium" style={{ textTransform: "uppercase" }}>{item.mesReferencia}</td>
                    <td className="text-right text-red-400 font-semibold">{formatCurrency(item.valor)}</td>
                    <td className="text-center no-print">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => setEditAtraso(item)} className="text-primary-400 hover:text-primary-300 text-xs" title="Editar">
                          ✏️
                        </button>
                        <button onClick={() => handleDeleteAtraso(item.id)} className="text-red-400 hover:text-red-300 text-xs" title="Excluir">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center text-text-muted text-sm py-4">Nenhum atraso registrado.</td>
                </tr>
              )}
            </tbody>
            {prestacao.atrasos && prestacao.atrasos.length > 0 && (
              <tfoot>
                <tr>
                  <td className="font-bold">Total</td>
                  <td className="text-right text-red-400 font-bold">{formatCurrency(totalAtrasos)}</td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Edit Atraso Modal */}
        {editAtraso && (
          <div className="modal-overlay no-print" onClick={() => setEditAtraso(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">Editar Atraso</h2>
              <form action={handleEditAtraso} className="space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Mês de Referência *</label>
                  <input name="mesReferencia" required className="input-field" defaultValue={editAtraso.mesReferencia} />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Valor (R$) *</label>
                  <input name="valor" type="number" required step="0.01" className="input-field" defaultValue={editAtraso.valor} />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setEditAtraso(null)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Força o renderizador do Chrome/Firefox a manter os backgrounds cinza e amarelo na folha física */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; padding: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}