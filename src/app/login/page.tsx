// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro("");
        setCarregando(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha }),
            });

            // SE O SERVIDOR DEVOLVER ERRO (404 OU 500), VAMOS PEGAR O TEXTO HTML DELE
            if (!res.ok) {
                const textoErro = await res.text();
                console.error("CONTEÚDO RECEBIDO DO SERVIDOR:", textoErro);

                // Se for um erro conhecido da nossa API que veio em JSON, tenta extrair, senão mostra o status
                try {
                    const jsonErro = JSON.parse(textoErro);
                    throw new Error(jsonErro.error || "Falha ao realizar login");
                } catch {
                    throw new Error(`Erro no Servidor (${res.status}): Verifique o console do terminal.`);
                }
            }

            const dados = await res.json();
            router.push("/relatorios");
            router.refresh();
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="glass-card w-full max-w-md rounded-2xl p-8 border border-border bg-slate-900/50 backdrop-blur-md shadow-xl text-white">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-text-primary">Acesso ao Condomínio</h1>
                    <p className="text-sm text-slate-400 mt-1">Insira seus dados para visualizar os relatórios</p>
                </div>

                {erro && (
                    <div className="mb-4 p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-sm text-red-400 text-center">
                        {erro}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">E-mail Cadastrado</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
                            placeholder="exemplo@apto.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-300 mb-1">Senha de Acesso</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
                            placeholder="••••••••"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={carregando}
                        className="w-full py-3 mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/50 text-white font-semibold rounded-xl transition flex justify-center items-center"
                    >
                        {carregando ? "Autenticando..." : "Entrar no Sistema"}
                    </button>
                </form>
            </div>
        </div>
    );
}