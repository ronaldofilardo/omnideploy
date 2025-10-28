import { POST } from '../../../src/app/api/professionals/route'
import { PrismaClient } from '@prisma/client'
import { describe, it, expect, afterAll, beforeAll } from 'vitest'

const prisma = new PrismaClient()

describe('POST /api/professionals', () => {

  let createdProfessionalId: string
  let createdUserId: string

  beforeAll(async () => {
    // Cria usuário padrão para o teste
    const user = await prisma.user.create({
      data: {
        email: 'user@email.com',
        name: 'Usuário Teste',
        password: 'test',
      },
    })
    createdUserId = user.id
  })

  afterAll(async () => {
    if (createdProfessionalId) {
      await prisma.professional.delete({ where: { id: createdProfessionalId } })
    }
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } })
    }
  })

  it('cria um novo profissional', async () => {
    const professionalData = {
      name: 'Dr. House',
      specialty: 'Diagnóstico',
      address: '123, Baker Street',
      contact: '999-888-777',
      // userId não é necessário, pois o handler usa o usuário padrão
    }

    const request = new Request('http://localhost/api/professionals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(professionalData),
    })

    const response = await POST(request)
    const data = await response.json()

    createdProfessionalId = data.id // Guarda o ID para limpeza

    expect(response.status).toBe(201)
    expect(data.name).toBe(professionalData.name)
    expect(data.specialty).toBe(professionalData.specialty)
  })
})
