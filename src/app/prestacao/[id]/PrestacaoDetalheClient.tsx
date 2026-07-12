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

  const [showReceitaForm, setShowReceitaForm] = useState(false);
  const [showDespesaForm, setShowDespesaForm] = useState(false);
  const [showMovForm, setShowMovForm] = useState(false);
  const [showAtrasoForm, setShowAtrasoForm] = useState(false);

  const [editReceita, setEditReceita] = useState<Receita | null>(null);
  const [editDespesa, setEditDespesa] = useState<Despesa | null>(null);
  const [editMov, setEditMov] = useState<Movimentacao | null>(null);
  const [editAtraso, setEditAtraso] = useState<Atraso | null>(null);

  // Tratamento aritmético rigoroso para não concatenar strings
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

  const fmtNum = (value: number | string | null | undefined) => {
    const amount = Number(value ?? 0);
    return (Number.isFinite(amount) ? amount : 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number.isFinite(amount) ? amount : 0);
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

  return (
    <div className="p-4 max-w-7xl mx-auto text-black bg-white min-h-screen">

      {/* CONTROLES DE SISTEMA (NÃO SAEM NA IMPRESSÃO) */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-100 border border-gray-300 rounded-xl no-print">
        <Link href="/prestacao" className="text-gray-600 hover:text-black transition-colors font-medium">
          ← Voltar para Lista
        </Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-colors">
            🖨️ Imprimir Planilha
          </button>
          <button onClick={() => { if (confirm("Excluir tudo?")) { deletePrestacao(prestacao.id); router.push("/prestacao"); } }} className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition-colors">
            Excluir
          </button>
        </div>
      </div>

      {/* ============ CORPO EXCEL (ESTRUTURA DE MATRIZ IGUAL AO PRINT) ============ */}
      <div className="excel-container mx-auto">

        {/* Título Centralizado da Planilha */}
        <div className="text-center font-serif mb-4">
          <h1 className="text-base font-bold tracking-widest uppercase">PRESTAÇÃO DE CONTAS</h1>
          <div className="grid grid-cols-6 max-w-xs mx-auto text-xs font-bold mt-2 border border-black divide-x divide-black">
            <div className="col-span-2 bg-gray-100 py-0.5">MÊS:</div>
            <div className="col-span-4 py-0.5 uppercase">{formatMesReferencia(prestacao.mesReferencia)}</div>
          </div>
        </div>

        {/* Bloco Integrado Superior: Receitas vs Despesas */}
        <div className="grid grid-cols-2 border-t border-x border-black divide-x divide-black text-[11px]">
          <div className="text-center font-bold bg-white py-0.5 border-b border-black">Receitas</div>
          <div className="text-center font-bold bg-white py-0.5 border-b border-black">DESPESAS</div>
        </div>

        <div className="grid grid-cols-2 border-x border-b border-black divide-x divide-black text-[10px]">
          {/* Cabeçalhos de Colunas */}
          <div className="grid grid-cols-3 font-bold text-center border-b border-black divide-x divide-black bg-white">
            <div className="col-span-2 text-left px-2 py-0.5">DESCRIMINAÇÃO</div>
            <div className="py-0.5">Valor</div>
          </div>
          <div className="grid grid-cols-3 font-bold text-center border-b border-black divide-x divide-black bg-white">
            <div className="col-span-2 text-left px-2 py-0.5">DESCRIMINAÇÃO</div>
            <div className="py-0.5">Valor</div>
          </div>
        </div>

        {/* Linhas de Dados Lado a Lado */}
        <div className="grid grid-cols-2 border-x border-b border-black divide-x divide-black text-[10px] items-start bg-white">

          {/* Lado Esquerdo: Itens de Receita */}
          <div className="divide-y divide-black">
            <div className="grid grid-cols-3 divide-x divide-black font-medium">
              <div className="col-span-2 px-2 py-0.5">SALDO MÊS ANTERIOR</div>
              <div className="text-right px-2 py-0.5">R$ {fmtNum(saldoAnterior)}</div>
            </div>
            {prestacao.receitas.map((r) => (
              <div key={r.id} className="grid grid-cols-3 divide-x divide-black group">
                <div className="col-span-2 px-2 py-0.5 uppercase flex justify-between">
                  <span>{r.descricao}</span>
                  <button onClick={async () => { if (confirm("Remover?")) { await deleteReceita(r.id, prestacao.id); router.refresh(); } }} className="no-print text-red-500 text-[8px]">([x])</button>
                </div>
                <div className="text-right px-2 py-0.5">R$ {fmtNum(r.valor)}</div>
              </div>
            ))}
            {/* Espaçadores vazios para alinhar a grade */}
            {Array.from({ length: Math.max(0, 6 - prestacao.receitas.length) }).map((_, i) => (
              <div key={i} className="grid grid-cols-3 divide-x divide-black h-[17px]">
                <div className="col-span-2"></div>
                <div></div>
              </div>
            ))}

            {/* Sub-tabela de Atrasados em Amarelo colada dentro da Coluna */}
            <div className="border-t border-black">
              <div className="bg-yellow-300 font-bold px-2 py-0.5 border-b border-black tracking-wide uppercase">
                CONDOMÍNIOS EM ATRASO
              </div>
              <div className="divide-y divide-black">
                {prestacao.atrasos?.map((a) => (
                  <div key={a.id} className="grid grid-cols-3 divide-x divide-black font-medium">
                    <div className="px-2 py-0.5 uppercase">{a.mesReferencia}</div>
                    <div className="col-span-2 text-left px-4 py-0.5">R$ {fmtNum(a.valor)}</div>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 2 - (prestacao.atrasos?.length || 0)) }).map((_, i) => (
                  <div key={i} className="grid grid-cols-3 divide-x divide-black h-[17px]">
                    <div></div>
                    <div className="col-span-2"></div>
                  </div>
                ))}
                <div className="grid grid-cols-3 divide-x divide-black font-bold bg-yellow-200">
                  <div className="px-2 py-0.5">TOTAL</div>
                  <div className="col-span-2 text-left px-4 py-0.5">R$ {fmtNum(totalAtrasos)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito: Itens de Despesa */}
          <div className="divide-y divide-black h-full">
            {prestacao.despesas.map((d) => (
              <div key={d.id} className="grid grid-cols-3 divide-x divide-black">
                <div className="col-span-2 px-2 py-0.5 uppercase flex justify-between">
                  <span>{d.descricao}</span>
                  <button onClick={async () => { if (confirm("Remover?")) { await deleteDespesa(d.id, prestacao.id); router.refresh(); } }} className="no-print text-red-500 text-[8px]">([x])</button>
                </div>
                <div className="text-right px-2 py-0.5 font-medium">R$ {fmtNum(d.valor)}</div>
              </div>
            ))}
            {/* Espaçadores vazios estendidos para fechar a altura simétrica */}
            {Array.from({ length: Math.max(0, 12 - prestacao.despesas.length) }).map((_, i) => (
              <div key={i} className="grid grid-cols-3 divide-x divide-black h-[17px]">
                <div className="col-span-2"></div>
                <div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Linha Fina de Totais Gerais das Colunas */}
        <div className="grid grid-cols-2 border-x border-b border-black divide-x divide-black text-[10px] font-bold bg-white">
          <div className="grid grid-cols-3 divide-x divide-black">
            <div className="col-span-2 px-2 py-0.5 text-center">TOTAL</div>
            <div className="text-right px-2 py-0.5">R$ {fmtNum(totalReceitasPlanilha)}</div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-black">
            <div className="col-span-2 px-2 py-0.5 text-center">TOTAL</div>
            <div className="text-right px-2 py-0.5">R$ {fmtNum(totalDespesas)}</div>
          </div>
        </div>

        {/* Bloco de Destaque Central: Crédito do Mês */}
        <div className="flex justify-center my-4">
          <div className="grid grid-cols-2 border border-black text-[11px] font-bold bg-yellow-300 text-center shadow-sm">
            <div className="px-4 py-1 border-r border-black uppercase tracking-wider">CRÉDITO DO MÊS</div>
            <div className="px-6 py-1 text-right">
              {creditoMesCalculado >= 0 ? "" : "-"}R$ {fmtNum(Math.abs(creditoMesCalculado))}
            </div>
          </div>
        </div>

        {/* Matriz Inferior das Três Contas Bancárias Correlatas */}
        <div className="grid grid-cols-3 border border-black divide-x divide-black text-[9px] bg-white items-start">

          {/* Caixa 1: Reserva para o Gás */}
          <div className="flex flex-col h-full justify-between divide-y divide-black">
            <div>
              <div className="bg-gray-200 text-center font-bold border-b border-black py-0.5 uppercase">RESERVA PARA O GÁS</div>
              <div className="divide-y divide-black">
                <div className="grid grid-cols-2 divide-x divide-black font-medium">
                  <div className="px-1.5 py-0.5">SALDO</div>
                  <div className="text-right px-1.5 py-0.5">R$ {fmtNum(prestacao.saldoReservaGas)}</div>
                </div>
                {movGas.map((m) => (
                  <div key={m.id} className="grid grid-cols-2 divide-x divide-black">
                    <div className="px-1.5 py-0.5 uppercase flex justify-between">
                      <span>{m.descricao}</span>
                      <button onClick={async () => { await deleteMovimentacao(m.id, prestacao.id); router.refresh(); }} className="no-print text-red-500 text-[7px]">x</button>
                    </div>
                    <div className="text-right px-1.5 py-0.5">{m.tipo === "saida" ? "-" : ""}R$ {fmtNum(m.valor)}</div>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 3 - movGas.length) }).map((_, i) => (
                  <div key={i} className="grid grid-cols-2 divide-x divide-black h-[15px]">
                    <div></div>
                    <div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border-t border-black px-1.5 py-0.5 font-bold flex justify-between text-[10px]">
              <span className="uppercase">{formatMesReferencia(prestacao.mesReferencia).split(" ")[0]}</span>
              <span>R$ {fmtNum(saldoFinalGas)}</span>
            </div>
          </div>

          {/* Caixa 2: Conta Corrente */}
          <div className="flex flex-col h-full justify-between divide-y divide-black">
            <div>
              <div className="bg-gray-200 text-center font-bold border-b border-black py-0.5 uppercase">CONTA CORRENTE</div>
              <div className="divide-y divide-black">
                <div className="grid grid-cols-2 divide-x divide-black font-medium">
                  <div className="px-1.5 py-0.5 uppercase">{formatMesReferencia(prestacao.mesReferencia).split(" ")[0]}</div>
                  <div className="text-right px-1.5 py-0.5">R$ {fmtNum(prestacao.saldoContaCorrente)}</div>
                </div>
                {movCC.map((m) => (
                  <div key={m.id} className="grid grid-cols-2 divide-x divide-black">
                    <div className="px-1.5 py-0.5 uppercase flex justify-between">
                      <span>{m.descricao}</span>
                      <button onClick={async () => { await deleteMovimentacao(m.id, prestacao.id); router.refresh(); }} className="no-print text-red-500 text-[7px]">x</button>
                    </div>
                    <div className="text-right px-1.5 py-0.5">{m.tipo === "saida" ? "-" : ""}R$ {fmtNum(m.valor)}</div>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 3 - movCC.length) }).map((_, i) => (
                  <div key={i} className="grid grid-cols-2 divide-x divide-black h-[15px]">
                    <div></div>
                    <div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border-t border-black px-1.5 py-0.5 font-bold flex justify-between text-[10px]">
              <span className="uppercase">{formatMesReferencia(prestacao.mesReferencia).split(" ")[0]}</span>
              <span>R$ {fmtNum(saldoFinalCC)}</span>
            </div>
          </div>

          {/* Caixa 3: Conta Poupança */}
          <div className="flex flex-col h-full justify-between divide-y divide-black">
            <div>
              <div className="bg-gray-200 text-center font-bold border-b border-black py-0.5 uppercase">CONTA POUPANÇA</div>
              <div className="divide-y divide-black">
                <div className="grid grid-cols-2 divide-x divide-black font-medium">
                  <div className="px-1.5 py-0.5">MÊS ANTERIOR</div>
                  <div className="text-right px-1.5 py-0.5">R$ {fmtNum(prestacao.saldoPoupanca)}</div>
                </div>
                {movPoupança.map((m) => (
                  <div key={m.id} className="grid grid-cols-2 divide-x divide-black">
                    <div className="px-1.5 py-0.5 uppercase flex justify-between">
                      <span>{m.descricao}</span>
                      <button onClick={async () => { await deleteMovimentacao(m.id, prestacao.id); router.refresh(); }} className="no-print text-red-500 text-[7px]">x</button>
                    </div>
                    <div className="text-right px-1.5 py-0.5">{m.tipo === "saida" ? "-" : ""}R$ {fmtNum(m.valor)}</div>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 3 - movPoupança.length) }).map((_, i) => (
                  <div key={i} className="grid grid-cols-2 divide-x divide-black h-[15px]">
                    <div></div>
                    <div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border-t border-black px-1.5 py-0.5 font-bold flex justify-between text-[10px]">
              <span className="uppercase">{formatMesReferencia(prestacao.mesReferencia).split(" ")[0]}</span>
              <span>R$ {fmtNum(saldoFinalPoupanca)}</span>
            </div>
          </div>
        </div>

        {/* CONTROLES DE ADIÇÃO EM TELA (NÃO IMPRIME DE JEITO NENHUM) */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded-lg space-y-2 no-print text-xs">
          <div className="font-bold text-gray-700">Lançamentos Rápidos de Suporte:</div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setShowReceitaForm(!showReceitaForm); setShowDespesaForm(false); setShowAtrasoForm(false); setShowMovForm(false); }} className="bg-emerald-600 text-white px-2.5 py-1 rounded">+ Receita</button>
            <button onClick={() => { setShowDespesaForm(!showDespesaForm); setShowReceitaForm(false); setShowAtrasoForm(false); setShowMovForm(false); }} className="bg-red-600 text-white px-2.5 py-1 rounded">+ Despesa</button>
            <button onClick={() => { setShowAtrasoForm(!showAtrasoForm); setShowReceitaForm(false); setShowDespesaForm(false); setShowMovForm(false); }} className="bg-yellow-600 text-black font-semibold px-2.5 py-1 rounded">+ Historico Atraso</button>
            <button onClick={() => { setShowMovForm(!showMovForm); setShowReceitaForm(false); setShowDespesaForm(false); setShowAtrasoForm(false); }} className="bg-gray-800 text-white px-2.5 py-1 rounded">+ Movimentar Saldo Interno</button>
          </div>

          {showReceitaForm && (
            <form action={handleAddReceita} className="p-2 border bg-white space-y-2 rounded">
              <input name="descricao" required placeholder="Discriminação da Receita" className="w-full border p-1" />
              <input name="valor" type="number" required step="0.01" placeholder="Valor (R$)" className="w-full border p-1" />
              <button type="submit" className="bg-black text-white px-3 py-1 rounded">Adicionar</button>
            </form>
          )}
          {showDespesaForm && (
            <form action={handleAddDespesa} className="p-2 border bg-white space-y-2 rounded">
              <input name="descricao" required placeholder="Discriminação da Despesa" className="w-full border p-1" />
              <input name="valor" type="number" required step="0.01" placeholder="Valor (R$)" className="w-full border p-1" />
              <button type="submit" className="bg-black text-white px-3 py-1 rounded">Adicionar</button>
            </form>
          )}
          {showAtrasoForm && (
            <form action={handleAddAtraso} className="p-2 border bg-white space-y-2 rounded">
              <input name="mesReferencia" required placeholder="Mês (ex: JUNHO)" className="w-full border p-1 uppercase" />
              <input name="valor" type="number" required step="0.01" placeholder="Valor total em aberto" className="w-full border p-1" />
              <button type="submit" className="bg-black text-white px-3 py-1 rounded">Adicionar</button>
            </form>
          )}
          {showMovForm && (
            <form action={handleAddMov} className="p-2 border bg-white space-y-2 rounded grid grid-cols-2 gap-2">
              <select name="conta" required className="border p-1">
                <option value="reserva_gas">Reserva p/ Gás</option>
                <option value="conta_corrente">Conta Corrente</option>
                <option value="poupanca">Poupança</option>
              </select>
              <select name="tipo" required className="border p-1">
                <option value="entrada">Entrada (+)</option>
                <option value="saida">Saída (-)</option>
              </select>
              <input name="descricao" required placeholder="Histórico" className="border p-1 col-span-2" />
              <input name="valor" type="number" required step="0.01" placeholder="Valor" className="border p-1 col-span-2" />
              <button type="submit" className="bg-black text-white px-3 py-1 rounded col-span-2">Registrar Transação</button>
            </form>
          )}
        </div>
      </div>

      {/* ESTILOS DE MATRIZ DE TABELA CONTÍNUA EXCEL */}
      <style jsx global>{`
        .excel-container {
          width: 790px;
          padding: 10px;
          background: #ffffff;
        }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
          .excel-container { width: 100% !important; padding: 0 !important; margin: 0 !important; transform: scale(1); }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

    </div>
  );
}