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

  // Garantindo que as operações matemáticas usem números puros
  const saldoAnterior = parseFloat(String(prestacao.saldoMesAnterior || 0));
  const totalReceitas = parseFloat(String(prestacao.totalReceitas || 0));
  const totalDespesas = parseFloat(String(prestacao.totalDespesas || 0));

  const totalAtrasos = prestacao.atrasos?.reduce((sum, a) => sum + parseFloat(String(a.valor || 0)), 0) ?? 0;
  const totalReceitasPlanilha = saldoAnterior + totalReceitas;
  const creditoMesCalculado = totalReceitasPlanilha - totalDespesas;

  const movGas = prestacao.movimentacoes?.filter(m => m.conta === "reserva_gas") || [];
  const movCC = prestacao.movimentacoes?.filter(m => m.conta === "conta_corrente") || [];
  const movPoupança = prestacao.movimentacoes?.filter(m => m.conta === "poupanca") || [];

  const saldoFinalGas = movGas.reduce((sum, m) => sum + (m.tipo === "entrada" ? parseFloat(String(m.valor)) : -parseFloat(String(m.valor))), parseFloat(String(prestacao.saldoReservaGas || 0)));
  const saldoFinalCC = movCC.reduce((sum, m) => sum + (m.tipo === "entrada" ? parseFloat(String(m.valor)) : -parseFloat(String(m.valor))), parseFloat(String(prestacao.saldoContaCorrente || 0)));
  const saldoFinalPoupanca = movPoupança.reduce((sum, m) => sum + (m.tipo === "entrada" ? parseFloat(String(m.valor)) : -parseFloat(String(m.valor))), parseFloat(String(prestacao.saldoPoupanca || 0)));

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

  const handleAddMov = async (formData: FormData) => {
    startTransition(async () => {
      await addMovimentacao(prestacao.id, formData);
      setShowMovForm(false);
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

  const contaLabel: Record<string, string> = {
    reserva_gas: "Reserva p/ Gás",
    conta_corrente: "Conta Corrente",
    poupanca: "Poupança",
  };

  return (
    <div className="fade-in">

      {/* ============ PRINT LAYOUT (ESTILO FIEL EXCEL) ============ */}
      <div className="print-layout-excel">

        {/* Título da Planilha */}
        <div style={{ textHeading: "center", width: "100%", textAlign: "center", marginBottom: "15px" }}>
          <div style={{ fontSize: "14pt", fontWeight: "bold", letterSpacing: "1px" }}>PRESTAÇÃO DE CONTAS</div>
          <table style={{ margin: "10px auto 0 auto", borderCollapse: "collapse", border: "1px solid black", fontSize: "10pt" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid black", padding: "3px 15px", fontWeight: "bold", background: "#f2f2f2" }}>MÊS:</td>
                <td style={{ border: "1px solid black", padding: "3px 30px", fontWeight: "bold", textTransform: "uppercase" }}>{formatMesReferencia(prestacao.mesReferencia)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Grade de Receitas vs Despesas */}
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid black", fontSize: "9pt", backgroundColor: "white" }}>
          <thead>
            {/* Bloco de Título de Seção */}
            <tr style={{ fontWeight: "bold", textAlign: "center" }}>
              <th colSpan={2} style={{ border: "1px solid black", padding: "4px", background: "#ffffff" }}>Receitas</th>
              <th colSpan={2} style={{ border: "1px solid black", padding: "4px", background: "#ffffff" }}>DESPESAS</th>
            </tr>
            {/* Cabeçalhos das Colunas */}
            <tr style={{ fontWeight: "bold", background: "#ffffff" }}>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "left", width: "35%" }}>DESCRIMINAÇÃO</th>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "right", width: "15%" }}>Valor</th>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "left", width: "35%" }}>DESCRIMINAÇÃO</th>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "right", width: "15%" }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {/* Linha do Saldo Anterior fixo à esquerda combinando com a primeira despesa */}
            <tr>
              <td style={{ border: "1px solid black", padding: "3px 6px" }}>SALDO MÊS ANTERIOR</td>
              <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>R$ {fmtNum(saldoAnterior)}</td>
              <td style={{ border: "1px solid black", padding: "3px 6px" }}>{prestacao.despesas[0]?.descricao.toUpperCase() || ""}</td>
              <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>{prestacao.despesas[0] ? `R$ ${fmtNum(prestacao.despesas[0].valor)}` : ""}</td>
            </tr>

            {/* Loop Misto para renderizar as linhas paralelas perfeitamente integradas */}
            {Array.from({ length: Math.max(10, prestacao.receitas.length, prestacao.despesas.length - 1) }).map((_, index) => {
              const rItem = prestacao.receitas[index];
              const dItem = prestacao.despesas[index + 1]; // +1 porque a primeira já foi listada acima

              return (
                <tr key={index}>
                  {/* Células de Receita */}
                  <td style={{ border: "1px solid black", padding: "3px 6px" }}>{rItem?.descricao.toUpperCase() || ""}</td>
                  <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>{rItem ? `R$ ${fmtNum(rItem.valor)}` : ""}</td>

                  {/* Células de Despesa */}
                  <td style={{ border: "1px solid black", padding: "3px 6px" }}>{dItem?.descricao.toUpperCase() || ""}</td>
                  <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>{dItem ? `R$ ${fmtNum(dItem.valor)}` : ""}</td>
                </tr>
              );
            })}

            {/* Bloco de Condomínios em Atraso Amarelo incorporado na tabela de receitas */}
            <tr style={{ background: "#ffff00", fontWeight: "bold" }}>
              <td colSpan={2} style={{ border: "1px solid black", padding: "4px 6px" }}>CONDOMÍNIOS EM ATRASO</td>
              <td style={{ border: "1px solid black", background: "#ffffff" }}></td>
              <td style={{ border: "1px solid black", background: "#ffffff" }}></td>
            </tr>

            {/* Inserção dinâmica dos atrasos com formato de célula dupla como a planilha */}
            {Array.from({ length: Math.max(3, prestacao.atrasos?.length || 0) }).map((_, index) => {
              const aItem = prestacao.atrasos?.[index];
              return (
                <tr key={`atraso-${index}`}>
                  <td style={{ border: "1px solid black", padding: "3px 6px", textTransform: "uppercase" }}>{aItem?.mesReferencia || ""}</td>
                  <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "left" }}>{aItem ? `R$ ${fmtNum(aItem.valor)}` : ""}</td>
                  <td style={{ border: "1px solid black" }}></td>
                  <td style={{ border: "1px solid black" }}></td>
                </tr>
              );
            })}

            {/* Totalizador de Atrasos Amarelo */}
            <tr style={{ background: "#ffff99", fontWeight: "bold" }}>
              <td style={{ border: "1px solid black", padding: "3px 6px" }}>TOTAL</td>
              <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "left" }}>R$ {fmtNum(totalAtrasos)}</td>
              <td style={{ border: "1px solid black", background: "#ffffff" }}></td>
              <td style={{ border: "1px solid black", background: "#ffffff" }}></td>
            </tr>

            {/* Linhas vazias estruturais de fechamento antes do total geral */}
            <tr style={{ height: "15px" }}><td style={{ border: "1px solid black" }}></td><td style={{ border: "1px solid black" }}></td><td style={{ border: "1px solid black" }}></td><td style={{ border: "1px solid black" }}></td></tr>

            {/* Rodapé de Totais Gerais da Planilha Superior */}
            <tr style={{ fontWeight: "bold" }}>
              <td style={{ border: "1px solid black", padding: "4px 6px", textAlign: "center" }}>TOTAL</td>
              <td style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right" }}>R$ {fmtNum(totalReceitasPlanilha)}</td>
              <td style={{ border: "1px solid black", padding: "4px 6px", textAlign: "center" }}>TOTAL</td>
              <td style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right" }}>R$ {fmtNum(totalDespesas)}</td>
            </tr>
          </tbody>
        </table>

        {/* Bloco de Destaque: Crédito do Mês */}
        <div style={{ display: "flex", justifyContent: "center", margin: "15px 0" }}>
          <table style={{ borderCollapse: "collapse", border: "1px solid black", fontWeight: "bold", fontSize: "10pt" }}>
            <tbody>
              <tr style={{ background: "#ffff00" }}>
                <td style={{ border: "1px solid black", padding: "4px 20px", uppercase: "true" }}>CRÉDITO DO MÊS</td>
                <td style={{ border: "1px solid black", padding: "4px 25px", textAlign: "right" }}>
                  {creditoMesCalculado >= 0 ? "" : "-"}R$ {fmtNum(Math.abs(creditoMesCalculado))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Rodapé de Contas e Movimentações Financeiras Triplas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0px", border: "1px solid black", backgroundColor: "white", fontSize: "8pt" }}>

          {/* Conta 1: Reserva para o Gás */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "between", borderRight: "1px solid black" }}>
            <div style={{ background: "#d9d9d9", textAlign: "center", fontWeight: "bold", borderBottom: "1px solid black", padding: "3px" }}>RESERVA PARA O GÁS</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid black" }}>
                  <td style={{ padding: "3px 5px", borderRight: "1px solid black" }}>SALDO</td>
                  <td style={{ padding: "3px 5px", textAlign: "right" }}>R$ {fmtNum(prestacao.saldoReservaGas)}</td>
                </tr>
                {movGas.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid black" }}>
                    <td style={{ padding: "3px 5px", borderRight: "1px solid black", textTransform: "uppercase" }}>{m.descricao}</td>
                    <td style={{ padding: "3px 5px", textAlign: "right" }}>{m.tipo === "saida" ? "-" : ""}R$ {fmtNum(m.valor)}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 3 - movGas.length) }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid black", height: "16px" }}><td style={{ borderRight: "1px solid black" }}></td><td></td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ borderTop: "1px solid black", padding: "3px 5px", fontWeight: "bold", display: "flex", justifyContent: "space-between", fontSize: "9pt", background: "#ffffff" }}>
              <span style={{ textTransform: "uppercase" }}>{formatMesReferencia(prestacao.mesReferencia).split(" ")[0]}</span>
              <span>R$ {fmtNum(saldoFinalGas)}</span>
            </div>
          </div>

          {/* Conta 2: Conta Corrente */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "between", borderRight: "1px solid black" }}>
            <div style={{ background: "#d9d9d9", textAlign: "center", fontWeight: "bold", borderBottom: "1px solid black", padding: "3px" }}>CONTA CORRENTE</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid black" }}>
                  <td style={{ padding: "3px 5px", borderRight: "1px solid black", textTransform: "uppercase" }}>{formatMesReferencia(prestacao.mesReferencia).split(" ")[0]}</td>
                  <td style={{ padding: "3px 5px", textAlign: "right" }}>R$ {fmtNum(prestacao.saldoContaCorrente)}</td>
                </tr>
                {movCC.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid black" }}>
                    <td style={{ padding: "3px 5px", borderRight: "1px solid black", textTransform: "uppercase" }}>{m.descricao}</td>
                    <td style={{ padding: "3px 5px", textAlign: "right" }}>{m.tipo === "saida" ? "-" : ""}R$ {fmtNum(m.valor)}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 3 - movCC.length) }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid black", height: "16px" }}><td style={{ borderRight: "1px solid black" }}></td><td></td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ borderTop: "1px solid black", padding: "3px 5px", fontWeight: "bold", display: "flex", justifyContent: "space-between", fontSize: "9pt", background: "#ffffff" }}>
              <span style={{ textTransform: "uppercase" }}>{formatMesReferencia(prestacao.mesReferencia).split(" ")[0]}</span>
              <span>R$ {fmtNum(saldoFinalCC)}</span>
            </div>
          </div>

          {/* Conta 3: Conta Poupança */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "between" }}>
            <div style={{ background: "#d9d9d9", textAlign: "center", fontWeight: "bold", borderBottom: "1px solid black", padding: "3px" }}>CONTA POUPANÇA</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid black" }}>
                  <td style={{ padding: "3px 5px", borderRight: "1px solid black" }}>MÊS ANTERIOR</td>
                  <td style={{ padding: "3px 5px", textAlign: "right" }}>R$ {fmtNum(prestacao.saldoPoupanca)}</td>
                </tr>
                {movPoupança.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid black" }}>
                    <td style={{ padding: "3px 5px", borderRight: "1px solid black", textTransform: "uppercase" }}>{m.descricao}</td>
                    <td style={{ padding: "3px 5px", textAlign: "right" }}>{m.tipo === "saida" ? "-" : ""}R$ {fmtNum(m.valor)}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 3 - movPoupança.length) }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid black", height: "16px" }}><td style={{ borderRight: "1px solid black" }}></td><td></td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ borderTop: "1px solid black", padding: "3px 5px", fontWeight: "bold", display: "flex", justifyContent: "space-between", fontSize: "9pt", background: "#ffffff" }}>
              <span style={{ textTransform: "uppercase" }}>{formatMesReferencia(prestacao.mesReferencia).split(" ")[0]}</span>
              <span style={{ fontWeight: "bold" }}>R$ {fmtNum(saldoFinalPoupanca)}</span>
            </div>
          </div>

        </div>

      </div>

      {/* ============ SCREEN LAYOUT (MANTIDO INALTERADO) ============ */}
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

        {/* Lançamentos Rápidos Inferiores de Movimentação */}
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
          </table>
        </div>
      </div>

      {/* MODAL GLOBAL PARA EDICÃO DE REPOSITÓRIO */}
      {editAtraso && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center no-print p-4 z-50">
          <div className="bg-white border border-black p-4 w-full max-w-sm">
            <h3 className="font-bold text-sm mb-2 uppercase">Editar Item em Atraso</h3>
            <form action={handleEditAtraso} className="space-y-2 text-xs">
              <input name="mesReferencia" required className="w-full border p-1 uppercase" defaultValue={editAtraso.mesReferencia} />
              <input name="valor" type="number" required step="0.01" className="w-full border p-1" defaultValue={editAtraso.valor} />
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setEditAtraso(null)} className="border px-2 py-1">Cancelar</button>
                <button type="submit" className="bg-black text-white px-2 py-1">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ ESTILIZAÇÃO CSS DE CONTROLE DA IMPRESSÃO FIEL ============ */}
      <style jsx global>{`
        /* Por padrão oculta o layout de planilha na tela */
        .print-layout-excel {
          display: none;
        }

        @media print {
          /* Inverte a visibilidade dos blocos */
          .screen-only, .no-print { 
            display: none !important; 
          }
          .print-layout-excel { 
            display: block !important; 
            width: 100% !important;
            max-width: 790px !important;
            margin: 0 auto !important;
            background: white !important;
            color: black !important;
          }
          
          body { 
            background: white !important; 
            color: black !important; 
            padding: 0 !important; 
            margin: 0 !important; 
          }

          /* Força o navegador a imprimir as cores de preenchimento (Amarelo e Cinza Excel) */
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }

          /* Garante que as bordas pretas fiquem visíveis na folha física */
          table, th, td, div {
            border-color: #000000 !important;
          }
        }
      `}</style>
    </div>
  );
}