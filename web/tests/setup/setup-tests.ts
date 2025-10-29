import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const prisma = new PrismaClient()

async function resetTestDatabase() {
  try {
    // Reset do banco de dados de teste
    await execAsync('npx prisma migrate reset --force --skip-seed')
    
    // Criar usuário de teste padrão
    const hashedPassword = await bcrypt.hash('password123', 10)
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Teste da Silva',
        cpf: '123.456.789-00',
        telefone: '(41) 99999-9999',
      },
    })

    console.log('✅ Ambiente de teste configurado com sucesso')
  } catch (error) {
    console.error('❌ Erro ao configurar ambiente de teste:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetTestDatabase().catch(console.error)