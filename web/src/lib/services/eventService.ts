import { prisma } from '../prisma'
const fs = require('fs')

function isOverlapping(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && endA > startB
}

export async function createEvent(data: any) {
  // Validação de sobreposição
  let existingEvents = await prisma.healthEvent.findMany({
    where: {
      date: data.date,
      professionalId: data.professionalId,
    },
  })
  if (!Array.isArray(existingEvents)) existingEvents = []
  // Ignora eventos com o mesmo id (caso o mock retorne)
  if (existingEvents.some(ev => {
    if (!ev) return false;
    if (ev.id && data.id && ev.id === data.id) return false;
    return isOverlapping(data.startTime, data.endTime, ev.startTime, ev.endTime);
  })) {
    throw new Error('sobreposição')
  }
  return prisma.healthEvent.create({ data })
}

export async function getEvents(userId: string, opts?: { hasFiles?: boolean }) {
  const events = await prisma.healthEvent.findMany({
    where: { userId },
    include: { professional: true },
  })
  if (opts?.hasFiles) {
    return events.filter(e => Array.isArray(e.files) && e.files.length > 0)
  }
  return events
}

export async function updateEvent(id: string, data: any) {
  // Buscar evento atual
  const current = await prisma.healthEvent.findUnique({ where: { id } })
  if (!current) throw new Error('Evento não encontrado')
  // Se for atualizar horário, validar sobreposição
  const newStart = data.startTime ?? current.startTime
  const newEnd = data.endTime ?? current.endTime
  let existingEvents = await prisma.healthEvent.findMany({
    where: {
      date: current.date,
      professionalId: current.professionalId,
      NOT: { id },
    },
  })
  if (!Array.isArray(existingEvents)) existingEvents = []
  if (existingEvents.some(ev => ev && isOverlapping(newStart, newEnd, ev.startTime, ev.endTime))) {
    throw new Error('sobreposição')
  }
  return prisma.healthEvent.update({ where: { id }, data })
}

export async function deleteEvent(id: string, deleteFiles = false) {
  if (deleteFiles) {
    const event = await prisma.healthEvent.findUnique({
      where: { id },
      select: { files: true },
    })
    if (event && Array.isArray(event.files)) {
      for (const file of event.files) {
        if (file && typeof file === 'object' && 'url' in file && file.url && fs.existsSync('.' + file.url)) {
          fs.unlinkSync('.' + file.url)
        }
      }
    }
  }
  return prisma.healthEvent.delete({ where: { id } })
}