// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Instancia o cliente do Prisma
const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { email, senha } = await request.json();

        // 1. Buscar usuário no banco do PostgreSQL usando o mapeamento do schema.prisma
        const usuario = await prisma.usuario.findUnique({
            where: { email }
        });

        // Se o usuário não existir ou estiver inativo, barra o acesso
        if (!usuario || !usuario.ativo) {
            return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
        }

        // 2. Validar a senha comparando com o hash criptografado
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
        }

        // 3. Gerar o Token JWT com os dados necessários para o filtro dos relatórios
        const token = jwt.sign(
            {
                id: usuario.id,
                nome: usuario.nome,
                role: usuario.role, // "sindico" ou "morador"
                apartamento: usuario.apartamentoNo, // Vincula o número do apto para o morador
            },
            process.env.JWT_SECRET || "secret-chave-temporaria-cond-2026",
            { expiresIn: "1d" }
        );

        const response = NextResponse.json({
            success: true,
            user: { nome: usuario.nome, role: usuario.role }
        });

        // 4. Salvar o token em um Cookie seguro (HttpOnly) lido pelo Next.js no servidor
        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 86400, // 1 dia (em segundos)
            path: "/",
        });

        return response;
    } catch (error) {
        return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
    } finally {
        // Desconecta o Prisma para evitar gargalo de conexões abertas
        await prisma.$disconnect();
    }
}