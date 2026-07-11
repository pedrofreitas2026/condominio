import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatMesReferencia(mesReferencia: string | null | undefined): string {
  if (!mesReferencia) return "";
  const parts = mesReferencia.split("-");
  if (parts.length !== 2) return mesReferencia;
  
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${months[monthIdx]} de ${year}`;
  }
  return mesReferencia;
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

export function getCurrentMonthRef(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function calcConsumoGas(leituraAnterior: number, leituraAtual: number): number {
  const diff = leituraAtual - leituraAnterior;
  return diff > 0 ? diff : 0;
}

export function calcPrecoGas(consumo: number, precoGasM3Padrao: number): number {
  return precoGasM3Padrao;
}

export function calcValorGas(consumo: number, precoGas: number): number {
  return consumo * precoGas;
}

export function calcTotalAPagar(taxaCondominio: number, taxaExtra: number, valorGas: number): number {
  return taxaCondominio + taxaExtra + valorGas;
}
