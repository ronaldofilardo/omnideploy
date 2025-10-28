import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetDatabase() {
  // Ordem importa por causa das FKs
  await prisma.notification.deleteMany({})
  await prisma.healthEvent.deleteMany({})
  await prisma.professional.deleteMany({})
  await prisma.user.deleteMany({})
}

resetDatabase()
  .then(() => {
    console.log('🧹 Banco de teste limpo com sucesso!')
    process.exit(0)
  })
  .catch((e) => {
    console.error('Erro ao limpar banco de teste:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
