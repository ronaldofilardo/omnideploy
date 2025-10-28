import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, NotificationType, NotificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Simples rate limit in-memory (MVP, troque por Redis/Edge em produção)
const rateLimitMap = new Map<string, { count: number; last: number }>();
const RATE_LIMIT = 10; // máx. 10 requisições por IP por hora
const PAYLOAD_SIZE_LIMIT = 2 * 1024; // 2KB

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
  const now = Date.now();
  const rate = rateLimitMap.get(ip) || { count: 0, last: now };
  if (now - rate.last > 60 * 60 * 1000) {
    rate.count = 0;
    rate.last = now;
  }
  rate.count++;
  rateLimitMap.set(ip, rate);
  if (rate.count > RATE_LIMIT) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validação básica do payload
  const { patientEmail, doctorName, examDate, report } = body;
  if (!patientEmail || !doctorName || !examDate || !report) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (typeof report !== 'object' || !report.fileName || !report.fileContent) {
    return NextResponse.json({ error: 'Invalid report format' }, { status: 400 });
  }
  // Limite de tamanho do arquivo
  if (Buffer.byteLength(report.fileContent, 'base64') > PAYLOAD_SIZE_LIMIT) {
    return NextResponse.json({ error: 'Report file too large' }, { status: 413 });
  }

  // Busca usuário
  const user = await prisma.user.findUnique({ where: { email: patientEmail } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Cria notificação
  const notification = await prisma.notification.create({
    data: {
      userId: user.id,
      type: NotificationType.LAB_RESULT,
      payload: { doctorName, examDate, report },
      status: NotificationStatus.UNREAD,
    },
  });

  return NextResponse.json({
    notificationId: notification.id,
    receivedAt: notification.createdAt,
  }, { status: 202 });
}
