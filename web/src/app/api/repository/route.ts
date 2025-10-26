import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função para obter o ID do usuário padrão (simulando uma sessão)
async function getDefaultUserId() {
  const user = await prisma.user.findUnique({ where: { email: 'user@email.com' } });
  if (!user) throw new Error('Usuário padrão não encontrado.');
  return user.id;
}

export async function GET() {
  try {
    const userId = await getDefaultUserId();

    // Busca apenas eventos que tenham arquivos (files array não é vazio)
    const eventsWithFiles = await prisma.healthEvent.findMany({
      where: {
        userId,
        files: {
          not: { equals: "[]" },
        },
      },
      include: {
        professional: true, // Inclui os dados do profissional associado
      },
      orderBy: {
        date: 'desc', // Ordena do mais recente para o mais antigo
      },
    });

    return NextResponse.json(eventsWithFiles);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[API Repository] Erro ao buscar eventos com arquivos:', { error: errorMessage });
    return NextResponse.json({ error: 'Erro interno ao buscar dados do repositório.' }, { status: 500 });
  }
}

