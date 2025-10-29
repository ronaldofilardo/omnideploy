import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, NotificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
  }

  // Busca notificações UNREAD para o usuário
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      status: NotificationStatus.UNREAD
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(notifications, { status: 200 });
}
