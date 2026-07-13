import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json();
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    
    if (!usuario || !usuario.ativo) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, role: usuario.role, apartamento: usuario.apartamentoNo },
      process.env.JWT_SECRET || "secret-chave-temporaria-cond-2026",
      { expiresIn: "1d" }
    );

    const response = NextResponse.json({ success: true, user: { nome: usuario.nome, role: usuario.role } });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
