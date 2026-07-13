// @/app/relatorios/page.tsx
import RelatoriosClient, { Cobranca, Prestacao } from "./RelatoriosClient";

export default async function RelatoriosPage() {
  // 1. Deixamos os arrays vazios, mas com a tipagem correta para o TypeScript não reclamar
  const cobrancas: Cobranca[] = [];
  const prestacoes: Prestacao[] = [];

  // 2. Simulamos o usuário logado localmente sem precisar de arquivos externos de autenticação
  // Quando você criar seu sistema de login, você substituirá esse objeto pela sessão real
  const usuarioLogado = {
    id: 1,
    nome: "Carlos S.",
    role: "sindico" as const, // Altere para "morador" para testar a visão restrita
    apartamento: "101"        // Opcional se for síndico, obrigatório para morador
  };

  return (
    <RelatoriosClient
      cobrancas={cobrancas}
      prestacoes={prestacoes}
      usuarioLogado={usuarioLogado}
    />
  );
}