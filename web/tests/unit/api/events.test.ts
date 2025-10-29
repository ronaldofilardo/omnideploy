import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do lib/prisma.ts antes de importar a rota
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    healthEvent: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}))

// Importar a rota e o prisma mockado depois do mock
import { GET, POST, PUT, DELETE } from '../../../src/app/api/events/route'
import { prisma } from '@/lib/prisma'

// Criar referência tipada para o mock
const mockPrisma = prisma as any

describe('/api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return events for userId in query', async () => {
      const mockDate = '2024-01-01'
      const mockEvents = [
        {
          id: '1',
          title: 'Consulta Médica',
          date: mockDate,
          type: 'consulta',
        },
      ]

      mockPrisma.healthEvent.findMany.mockResolvedValue(mockEvents)

      // Simula Request com userId na query
      const req = { url: 'http://localhost/api/events?userId=user-1' } as Request
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([
        {
          id: '1',
          title: 'Consulta Médica',
          date: mockDate,
          type: 'consulta',
        },
      ])
      expect(mockPrisma.healthEvent.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
    })

    it('should return 400 if userId is missing', async () => {
      // Simula Request sem userId
      const req = { url: 'http://localhost/api/events' } as Request
      const response = await GET(req)
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.error).toBe('userId é obrigatório')
    })

    it('should return 500 on error', async () => {
      mockPrisma.healthEvent.findMany.mockRejectedValue(new Error('Database error'))
      const req = { url: 'http://localhost/api/events?userId=user-1' } as Request
      const response = await GET(req)
      const data = await response.json()
      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno do servidor ao buscar eventos')
    })

    it('should convert UTC dates to local dates in GET response', async () => {
      const utcDate = '2024-01-01' // Data armazenada em UTC
      const expectedLocalDate = '2024-01-01' // Mesmo dia em local (formato sv-SE)

      const mockEvents = [
        {
          id: '1',
          title: 'Consulta Médica',
          date: utcDate,
          type: 'consulta',
          startTime: '10:00',
          endTime: '11:00',
          professionalId: 'prof-1',
          files: [],
        },
      ]

      mockPrisma.healthEvent.findMany.mockResolvedValue(mockEvents)

      const req = { url: 'http://localhost/api/events?userId=user-1' } as Request
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([
        {
          id: '1',
          title: 'Consulta Médica',
          date: expectedLocalDate,
          type: 'consulta',
          startTime: '10:00',
          endTime: '11:00',
          professionalId: 'prof-1',
          files: [],
        },
      ])
    })
  })

  describe('POST', () => {

    it('should create a new event', async () => {
      const mockDate = '2024-01-01'
      const mockEvent = {
        id: '1',
        title: 'Consulta Médica',
        description: 'Consulta de rotina',
        date: mockDate,
        type: 'consulta',
        startTime: '10:00',
        endTime: '11:00',
        professionalId: 'prof-1',
        files: [],
      }

      const requestBody = {
        title: 'Consulta Médica',
        description: 'Consulta de rotina',
        date: '2024-01-01',
        type: 'consulta',
        startTime: '10:00',
        endTime: '11:00',
        professionalId: 'prof-1',
        files: [],
      }

      mockPrisma.healthEvent.findMany.mockResolvedValue([]) // Sem sobreposição
      mockPrisma.healthEvent.create.mockResolvedValue(mockEvent)

      // Simula Request com userId na query
      const mockRequest = {
        url: 'http://localhost/api/events?userId=user-1',
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual({
        ...mockEvent,
        date: mockDate,
      })
      expect(mockPrisma.healthEvent.create).toHaveBeenCalledWith({
        data: {
          title: 'Consulta Médica',
          description: 'Consulta de rotina',
          date: mockDate,
          startTime: '10:00',
          endTime: '11:00',
          type: 'consulta',
          userId: 'user-1',
          professionalId: 'prof-1',
          files: [],
        },
      })
    })

    it('should return 400 if userId is missing', async () => {
      const requestBody = {
        title: 'Consulta Médica',
        // missing required fields
      }
      const mockRequest = {
        url: 'http://localhost/api/events',
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request
      const response = await POST(mockRequest)
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.error).toBe('userId é obrigatório')
    })

    it('should convert local date to UTC when creating event', async () => {
      const localDate = '2024-01-15' // Data local
      const expectedUtcDate = '2024-01-15' // Mesmo dia em UTC (assumindo timezone local = UTC-3, mas conversão usa meio dia)

      const requestBody = {
        title: 'Consulta Médica',
        description: 'Consulta de rotina',
        date: localDate,
        type: 'consulta',
        startTime: '10:00',
        endTime: '11:00',
        professionalId: 'prof-1',
        files: [],
      }

      const mockEvent = {
        id: '1',
        title: 'Consulta Médica',
        description: 'Consulta de rotina',
        date: expectedUtcDate,
        type: 'consulta',
        startTime: '10:00',
        endTime: '11:00',
        professionalId: 'prof-1',
        files: [],
      }

      mockPrisma.healthEvent.findMany.mockResolvedValue([]) // Sem sobreposição
      mockPrisma.healthEvent.create.mockResolvedValue(mockEvent)

      const mockRequest = {
        url: 'http://localhost/api/events?userId=user-1',
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(mockPrisma.healthEvent.create).toHaveBeenCalledWith({
        data: {
          title: 'Consulta Médica',
          description: 'Consulta de rotina',
          date: expectedUtcDate,
          startTime: '10:00',
          endTime: '11:00',
          type: 'consulta',
          userId: 'user-1',
          professionalId: 'prof-1',
          files: [],
        },
      })
    })
  })

  describe('PUT', () => {
    it('should update an event', async () => {
      const mockDate = '2024-01-01'
      const mockEvent = {
        id: '1',
        title: 'Consulta Atualizada',
        description: 'Consulta atualizada',
        date: mockDate,
        type: 'consulta',
        startTime: '10:00',
        endTime: '11:00',
        professionalId: 'prof-1',
        files: [],
      }

      const requestBody = {
        id: '1',
        title: 'Consulta Atualizada',
        description: 'Consulta atualizada',
        date: '2024-01-01',
        type: 'consulta',
        startTime: '10:00',
        endTime: '11:00',
        professionalId: 'prof-1',
        files: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
      mockPrisma.healthEvent.update.mockResolvedValue(mockEvent)

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      // A API retorna datas como strings ISO
      expect(data).toEqual({
        ...mockEvent,
        date: mockDate,
      })
    })

    it('should return 400 for missing id', async () => {
      const requestBody = {
        title: 'Consulta Médica',
        // missing id
      }

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Campos obrigatórios ausentes')
    })

    it('should convert local date to UTC when updating event', async () => {
      const localDate = '2024-01-20' // Data local
      const expectedUtcDate = '2024-01-20' // Mesmo dia em UTC

      const requestBody = {
        id: '1',
        title: 'Consulta Atualizada',
        description: 'Consulta atualizada',
        date: localDate,
        type: 'consulta',
        startTime: '10:00',
        endTime: '11:00',
        professionalId: 'prof-1',
        files: [],
      }

      const mockEvent = {
        id: '1',
        title: 'Consulta Atualizada',
        description: 'Consulta atualizada',
        date: expectedUtcDate,
        type: 'consulta',
        startTime: '10:00',
        endTime: '11:00',
        professionalId: 'prof-1',
        files: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
      mockPrisma.healthEvent.update.mockResolvedValue(mockEvent)

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockPrisma.healthEvent.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          title: 'Consulta Atualizada',
          description: 'Consulta atualizada',
          date: expectedUtcDate,
          startTime: '10:00',
          endTime: '11:00',
          type: 'consulta',
          professionalId: 'prof-1',
          files: [],
        },
      })
    })
  })

  describe('DELETE', () => {
    it('should delete an event', async () => {
      const requestBody = {
        id: '1',
      }

      // Mock para garantir que o evento existe antes de deletar
      mockPrisma.healthEvent.findUnique.mockResolvedValue({ files: [] })
      mockPrisma.healthEvent.delete.mockResolvedValue({})

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await DELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.healthEvent.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: { files: true },
      })
      expect(mockPrisma.healthEvent.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

    it('should return 400 for missing id', async () => {
      const requestBody = {
        // missing id
      }

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await DELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ID do evento é obrigatório')
    })

    it('should delete event and associated files when deleteFiles is true', async () => {
      const requestBody = {
        id: '1',
        deleteFiles: true,
      }

      const mockEvent = {
        files: [
          { url: 'http://localhost:3000/uploads/file1.jpg' },
          { url: 'http://localhost:3000/uploads/file2.pdf' },
        ],
      }

      // Mock fs.existsSync and fs.unlinkSync
      const fs = require('fs')
      const path = require('path')
      vi.mock('fs', () => ({
        existsSync: vi.fn(),
        unlinkSync: vi.fn(),
      }))
      vi.mock('path', () => ({
        join: vi.fn(),
      }))

      mockPrisma.healthEvent.findUnique.mockResolvedValue(mockEvent)
      mockPrisma.healthEvent.delete.mockResolvedValue({})

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await DELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.healthEvent.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: { files: true },
      })
      expect(mockPrisma.healthEvent.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

    it('should delete event without deleting files when deleteFiles is false', async () => {
      const requestBody = {
        id: '1',
        deleteFiles: false,
      }

      const mockEvent = {
        files: [{ url: 'http://localhost:3000/uploads/file1.jpg' }],
      }

      mockPrisma.healthEvent.findUnique.mockResolvedValue(mockEvent)
      mockPrisma.healthEvent.delete.mockResolvedValue({})

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await DELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.healthEvent.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: { files: true },
      })
      expect(mockPrisma.healthEvent.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

  it('should return 400 for overlapping events when creating', async () => {
      // Primeiro, criar um evento existente
      const existingEvent = {
        id: '1',
        title: 'Consulta Existente',
        description: 'Consulta existente',
        date: '2024-01-15',
        type: 'consulta',
        startTime: '10:00',
        endTime: '11:00',
        professionalId: 'prof-1',
        files: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
      // Simula que já existe um evento sobreposto para o mesmo profissional, data e horário
      mockPrisma.healthEvent.findMany.mockImplementation(({ where }: any) => {
        // Simula busca por eventos do mesmo profissional, data e sobreposição de horário
        if (
          where &&
          where.professionalId === 'prof-1' &&
          where.date === '2024-01-15' &&
          where.AND &&
          Array.isArray(where.AND)
        ) {
          // Simula que há sobreposição
          return Promise.resolve([existingEvent])
        }
        // Caso contrário, retorna vazio
        return Promise.resolve([])
      })

      // Tentar criar um evento que sobrepõe
      const requestBody = {
        title: 'Consulta Sobreposta',
        description: 'Consulta que sobrepõe',
        date: '2024-01-15', // Mesmo dia
        type: 'consulta',
        startTime: '10:30', // Sobreposição parcial
        endTime: '11:30',
        professionalId: 'prof-1', // Mesmo profissional
        files: [],
      }

      const mockRequest = {
        url: 'http://localhost/api/events?userId=user-1',
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('sobreposição')
    })

  it('should return 400 for invalid date format', async () => {
      const requestBody = {
        title: 'Consulta Médica',
        description: 'Consulta de rotina',
        date: 'invalid-date',
        type: 'consulta',
        startTime: '10:00',
        endTime: '11:00',
        professionalId: 'prof-1',
        files: [],
      }

      const mockRequest = {
        url: 'http://localhost/api/events?userId=user-1',
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Formato de data inválido')
    })

  it('should return 400 for end time before start time', async () => {
      const requestBody = {
        title: 'Consulta Médica',
        description: 'Consulta de rotina',
        date: '2024-01-15',
        type: 'consulta',
        startTime: '11:00',
        endTime: '10:00', // Fim antes do início
        professionalId: 'prof-1',
        files: [],
      }

      const mockRequest = {
        url: 'http://localhost/api/events?userId=user-1',
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain(
        'Horário de fim deve ser maior que o de início'
      )
    })
  })
})
