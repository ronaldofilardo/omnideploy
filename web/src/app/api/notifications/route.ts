import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, NotificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // Usuário padrão fixo para MVP
  const userEmail = 'user@email.com';

  // Busca o usuário pelo e-mail
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Busca notificações UNREAD para o usuário
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
      status: NotificationStatus.UNREAD
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(notifications, { status: 200 });
}
