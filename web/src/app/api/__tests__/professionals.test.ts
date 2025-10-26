import { POST } from '../professionals/route' // Importa a função diretamente
import { PrismaClient } from '@prisma/client'
import { describe, it, expect, afterAll } from 'vitest'

const prisma = new PrismaClient()

describe('POST /api/professionals', () => {
  let createdProfessionalId: string

  afterAll(async () => {
    if (createdProfessionalId) {
      await prisma.professional.delete({ where: { id: createdProfessionalId } })
    }
  })

  it('cria um novo profissional', async () => {
    const professionalData = {
      name: 'Dr. House',
      specialty: 'Diagnóstico',
      address: '123, Baker Street',
      contact: '999-888-777',
      userId: 'user-1', // Assumindo que o usuário padrão existe
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
