import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json();

    console.log("=== INÍCIO DA TENTATIVA DE LOGIN ===");
    console.log("E-mail recebido:", email);
    console.log("Senha recebida (comprimento):", senha ? senha.length : 0);

    // 1. Busca o usuário no banco
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    console.log("Usuário encontrado no banco?:", usuario ? "SIM" : "NÃO");

    if (!usuario) {
      console.log(`[BLOQUEIO]: Nenhum usuário encontrado com o e-mail: ${email}`);
      return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });
    }

    console.log("Dados do usuário recuperado:", {
      id: usuario.id,
      nome: usuario.nome,
      role: usuario.role,
      ativo: usuario.ativo,
      hashSenhaNoBanco: usuario.senha
    });

    // 2. Valida se o usuário está ativo
    if (!usuario.ativo) {
      console.log(`[BLOQUEIO]: O usuário ${email} foi encontrado, mas está inativo (ativo: false ou nulo).`);
      return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });
    }

    // 3. Valida a senha (bcrypt)
    console.log("Iniciando comparação de hash com bcrypt...");
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    console.log("A senha digitada confere com o hash?:", senhaValida ? "SIM" : "NÃO");

    if (!senhaValida) {
      console.log("[BLOQUEIO]: Senha incorreta.");
      return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });
    }

    // 4. Validação da chave JWT
    const jwtSecret = process.env.JWT_SECRET;
    console.log("JWT_SECRET configurada no ambiente?:", jwtSecret ? "SIM" : "NÃO (Usando fallback temporário)");

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, role: usuario.role, apartamento: usuario.apartamentoNo },
      jwtSecret || "secret-chave-temporaria-cond-2026",
      { expiresIn: "1d" }
    );

    console.log("Token JWT gerado com sucesso.");

    const response = NextResponse.json({ success: true, user: { nome: usuario.nome, role: usuario.role } });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });

    console.log("Cookie de autenticação configurado na resposta. Login bem-sucedido!");
    console.log("=== FIM DA TENTATIVA DE LOGIN (SUCESSO) ===");
    return response;

  } catch (error: any) {
    console.error("=== OCORREU UM ERRO NO CATCH DO LOGIN ===");
    console.error("Mensagem de erro:", error?.message || error);
    console.error("Stack trace completo:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}