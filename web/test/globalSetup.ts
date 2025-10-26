// test/globalSetup.ts
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function setup() {
  console.log('[Global Setup] Preparando o banco de dados de teste...')
  try {
    execSync('pnpm run db:migrate:test', { stdio: 'pipe' })

    // Verificar se estamos no banco de teste antes de limpar dados
    const databaseUrl = process.env.DATABASE_URL
    if (databaseUrl && databaseUrl.includes('omni_mvp_test')) {
      console.log('[Global Setup] Preparando banco de teste...')
      // Removido: limpeza automática de dados para preservar dados entre testes
      // await prisma.healthEvent.deleteMany({})
      // await prisma.professional.deleteMany({})
      // await prisma.user.deleteMany({})

      // Executar seed de dados de teste apenas se não houver dados
      const userCount = await prisma.user.count()
      if (userCount === 0) {
        execSync('pnpm run db:seed:test', { stdio: 'inherit' })
        console.log('[Global Setup] Dados de teste criados.')
      } else {
        console.log('[Global Setup] Dados de teste já existem, pulando seed.')
      }
    } else {
      console.log(
        '[Global Setup] Banco de desenvolvimento detectado. Pulando limpeza de dados.'
      )
    }

    console.log('[Global Setup] Banco de dados pronto.')
  } catch (error) {
    console.error('[Global Setup] Falha ao preparar o banco de dados:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

export async function teardown() {
  // Limpeza final, se necessário.
}
