// @/components/ReciboImpressao.tsx
import { Cobranca, CobrancaItem } from "@/app/types/relatorios";
import { formatMesReferencia } from "@/lib/utils";

interface ReciboImpressaoProps {
  cobranca: Cobranca;
  item: CobrancaItem;
  formatCurrency: (value: number) => string;
}

export function ReciboImpressao({ cobranca, item, formatCurrency }: ReciboImpressaoProps) {
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