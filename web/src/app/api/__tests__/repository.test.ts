import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do lib/prisma.ts antes de importar a rota
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    healthEvent: {
      findMany: vi.fn(),
    },
  },
}))

// Importar a rota e o prisma mockado depois do mock
import { GET } from '../repository/route'
import { prisma } from '@/lib/prisma'

// Criar referência tipada para o mock
const mockPrisma = prisma as any

describe('/api/repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return events with files for default user', async () => {
      const mockUser = { id: 'user-1' }
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Consulta Médica',
          date: '2025-01-15',
          type: 'CONSULTATION',
          files: [
            { slot: 'result', name: 'exame.pdf', url: '/uploads/exame.pdf' },
          ],
          professional: {
            id: 'prof-1',
            name: 'Dr. Silva',
            specialty: 'Cardiologia',
          },
        },
        {
          id: 'event-2',
          title: 'Exame Laboratorial',
          date: '2025-01-20',
          type: 'EXAM',
          files: [
            {
              slot: 'certificate',
              name: 'atestado.pdf',
              url: '/uploads/atestado.pdf',
            },
          ],
          professional: {
            id: 'prof-2',
            name: 'Dra. Santos',
            specialty: 'Clínica Geral',
          },
        },
      ]

  mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.healthEvent.findMany.mockResolvedValue(mockEvents)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockEvents)
      // A implementação da rota não usa select, só where
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@email.com' },
      })
      expect(mockPrisma.healthEvent.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          files: {
            not: { equals: '[]' },
          },
        },
        include: {
          professional: true,
        },
        orderBy: {
          date: 'desc',
        },
      })
    })

    it('should return empty array when no events with files exist', async () => {
      const mockUser = { id: 'user-1' }
      const mockEvents: any[] = []

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.healthEvent.findMany.mockResolvedValue(mockEvents)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should return 500 when default user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno ao buscar dados do repositório.')
    })

    it('should return 500 on database error during user lookup', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno ao buscar dados do repositório.')
    })

    it('should return 500 on database error during events lookup', async () => {
      const mockUser = { id: 'user-1' }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.healthEvent.findMany.mockRejectedValue(
        new Error('Database error')
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno ao buscar dados do repositório.')
    })

    it('should filter out events with empty files array', async () => {
      const mockUser = { id: 'user-1' }
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Consulta Médica',
          date: '2025-01-15',
          type: 'CONSULTATION',
          files: [
            { slot: 'result', name: 'exame.pdf', url: '/uploads/exame.pdf' },
          ],
          professional: {
            id: 'prof-1',
            name: 'Dr. Silva',
            specialty: 'Cardiologia',
          },
        },
        {
          id: 'event-2',
          title: 'Consulta Sem Arquivos',
          date: '2025-01-20',
          type: 'CONSULTATION',
          files: [], // Empty array should be filtered out
          professional: {
            id: 'prof-2',
            name: 'Dra. Santos',
            specialty: 'Clínica Geral',
          },
        },
      ]

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.healthEvent.findMany.mockResolvedValue([mockEvents[0]]) // Only return event with files

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('event-1')
    })

    it('should order events by date descending', async () => {
      const mockUser = { id: 'user-1' }
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Evento Antigo',
          date: '2025-01-10',
          type: 'CONSULTATION',
          files: [
            { slot: 'result', name: 'file.pdf', url: '/uploads/file.pdf' },
          ],
          professional: {
            id: 'prof-1',
            name: 'Dr. Silva',
            specialty: 'Cardiologia',
          },
        },
        {
          id: 'event-2',
          title: 'Evento Novo',
          date: '2025-01-20',
          type: 'EXAM',
          files: [
            { slot: 'certificate', name: 'cert.pdf', url: '/uploads/cert.pdf' },
          ],
          professional: {
            id: 'prof-2',
            name: 'Dra. Santos',
            specialty: 'Clínica Geral',
          },
        },
      ]

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.healthEvent.findMany.mockResolvedValue([
        mockEvents[1],
        mockEvents[0],
      ]) // Simulate DB returning in correct order

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].date).toBe('2025-01-20') // Most recent first
      expect(data[1].date).toBe('2025-01-10')
    })
  })
})
