
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

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

