import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'E-mail não informado.' }, { status: 400 })
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }
    // Retornar todos os dados relevantes (menos senha)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      telefone: user.telefone
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuário.' }, { status: 500 })
  }
}
