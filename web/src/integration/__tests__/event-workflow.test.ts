import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock do prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    healthEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    professional: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
} from '@/lib/services/eventService'
import {
  createProfessional,
  getProfessionals,
} from '@/lib/services/professionalService'

const mockPrisma = prisma as any

describe('Fluxo Completo de Eventos - Testes de Integração', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Fluxo de Criação de Evento', () => {
    it('deve criar evento completo com profissional', async () => {
      // Mock do usuário
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@email.com',
      })

      // Mock da criação do profissional
      const mockProfessional = {
        id: 'prof-1',
        name: 'Dr. João Silva',
        specialty: 'Cardiologia',
        userId: 'user-1',
      }
      mockPrisma.professional.create.mockResolvedValue(mockProfessional)

      // Mock da criação do evento
      const mockEvent = {
        id: 'event-1',
        title: 'Consulta Médica',
        description: 'Consulta de rotina',
        date: '2025-01-15',
        type: 'CONSULTATION',
        startTime: '10:00',
        endTime: '11:00',
        professionalId: 'prof-1',
        userId: 'user-1',
        files: [],
      }
      mockPrisma.healthEvent.create.mockResolvedValue(mockEvent)

      // Executar fluxo
      const professional = await createProfessional({
        name: 'Dr. João Silva',
        specialty: 'Cardiologia',
        userId: 'user-1',
      })

      const event = await createEvent({
        title: 'Consulta Médica',
        description: 'Consulta de rotina',
        date: '2025-01-15',
        type: 'CONSULTATION',
        startTime: '10:00',
        endTime: '11:00',
        professionalId: professional.id,
        userId: 'user-1',
        files: [],
      })

      // Verificações
      expect(professional.id).toBe('prof-1')
      expect(event.id).toBe('event-1')
      expect(event.professionalId).toBe(professional.id)
      expect(mockPrisma.professional.create).toHaveBeenCalledWith({
        data: {
          name: 'Dr. João Silva',
          specialty: 'Cardiologia',
          userId: 'user-1',
        },
      })
      expect(mockPrisma.healthEvent.create).toHaveBeenCalledWith({
        data: {
          title: 'Consulta Médica',
          description: 'Consulta de rotina',
          date: '2025-01-15',
          type: 'CONSULTATION',
          startTime: '10:00',
          endTime: '11:00',
          professionalId: 'prof-1',
          userId: 'user-1',
          files: [],
        },
      })
    })

    it('deve validar sobreposição ao criar evento', async () => {
      // Mock de eventos existentes
      mockPrisma.healthEvent.findMany.mockResolvedValue([
        {
          id: 'existing-1',
          date: '2025-01-15',
          startTime: '10:00',
          endTime: '11:00',
          professionalId: 'prof-1',
        },
      ])

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })

      // Tentar criar evento sobreposto deve falhar
      await expect(
        createEvent({
          title: 'Consulta Sobreposta',
          description: 'Consulta que conflita',
          date: '2025-01-15',
          type: 'CONSULTATION',
          startTime: '10:30',
          endTime: '11:30',
          professionalId: 'prof-1',
          userId: 'user-1',
          files: [],
        })
      ).rejects.toThrow('sobreposição')

      expect(mockPrisma.healthEvent.create).not.toHaveBeenCalled()
    })
  })

  describe('Fluxo de Consulta de Eventos', () => {
    it('deve buscar eventos com profissionais associados', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Consulta Médica',
          date: '2025-01-15',
          type: 'CONSULTATION',
          startTime: '10:00',
          endTime: '11:00',
          professionalId: 'prof-1',
          files: [],
          professional: {
            id: 'prof-1',
            name: 'Dr. João Silva',
            specialty: 'Cardiologia',
          },
        },
      ]

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
      mockPrisma.healthEvent.findMany.mockResolvedValue(mockEvents)

      const events = await getEvents('user-1')

      expect(events).toHaveLength(1)
      expect(events[0].professional.name).toBe('Dr. João Silva')
      expect(mockPrisma.healthEvent.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { professional: true },
      })
    })

    it('deve filtrar eventos com arquivos no repositório', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Consulta com arquivo',
          date: '2025-01-15',
          files: [{ name: 'exame.pdf', url: '/uploads/exame.pdf' }],
          professional: { name: 'Dr. Silva' },
        },
        {
          id: 'event-2',
          title: 'Consulta sem arquivo',
          date: '2025-01-16',
          files: [],
          professional: { name: 'Dr. Santos' },
        },
      ]

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
      mockPrisma.healthEvent.findMany.mockResolvedValue([mockEvents[0]]) // Apenas com arquivo

      const repositoryEvents = await getEvents('user-1', { hasFiles: true })

      expect(repositoryEvents).toHaveLength(1)
      expect(repositoryEvents[0].title).toBe('Consulta com arquivo')
    })
  })

  describe('Fluxo de Atualização de Evento', () => {
    it('deve atualizar evento existente', async () => {
      const existingEvent = {
        id: 'event-1',
        title: 'Consulta Original',
        description: 'Descrição original',
        date: '2025-01-15',
        type: 'CONSULTATION',
        startTime: '10:00',
        endTime: '11:00',
        professionalId: 'prof-1',
        userId: 'user-1',
      }

      const updatedEvent = {
        ...existingEvent,
        title: 'Consulta Atualizada',
        description: 'Descrição atualizada',
      }

      mockPrisma.healthEvent.findUnique.mockResolvedValue(existingEvent)
      mockPrisma.healthEvent.update.mockResolvedValue(updatedEvent)

      const result = await updateEvent('event-1', {
        title: 'Consulta Atualizada',
        description: 'Descrição atualizada',
      })

      expect(result.title).toBe('Consulta Atualizada')
      expect(mockPrisma.healthEvent.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: {
          title: 'Consulta Atualizada',
          description: 'Descrição atualizada',
        },
      })
    })

    it('deve validar sobreposição ao atualizar evento', async () => {
      const existingEvent = {
        id: 'event-1',
        date: '2025-01-15',
        startTime: '14:00',
        endTime: '15:00',
        professionalId: 'prof-1',
      }

      // Mock de outros eventos que conflitam
      mockPrisma.healthEvent.findMany.mockResolvedValue([
        {
          id: 'event-2',
          date: '2025-01-15',
          startTime: '10:00',
          endTime: '11:00',
          professionalId: 'prof-1',
        },
      ])

      mockPrisma.healthEvent.findUnique.mockResolvedValue(existingEvent)

      // Tentar atualizar para horário conflitante
      await expect(
        updateEvent('event-1', {
          startTime: '10:30',
          endTime: '11:30',
        })
      ).rejects.toThrow('sobreposição')

      expect(mockPrisma.healthEvent.update).not.toHaveBeenCalled()
    })
  })

  describe('Fluxo de Exclusão de Evento', () => {
    it('deve excluir evento e arquivos associados', async () => {
      const eventWithFiles = {
        id: 'event-1',
        files: [{ url: '/uploads/file1.pdf' }, { url: '/uploads/file2.jpg' }],
      }

      mockPrisma.healthEvent.findUnique.mockResolvedValue(eventWithFiles)
      mockPrisma.healthEvent.delete.mockResolvedValue({})

      // Mock do fs para exclusão de arquivos
      const fs = require('fs')
      vi.mock('fs', () => ({
        existsSync: vi.fn().mockReturnValue(true),
        unlinkSync: vi.fn(),
      }))

      await deleteEvent('event-1', true) // deleteFiles = true

      expect(mockPrisma.healthEvent.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        select: { files: true },
      })
      expect(mockPrisma.healthEvent.delete).toHaveBeenCalledWith({
        where: { id: 'event-1' },
      })
    })

    it('deve excluir evento mantendo arquivos', async () => {
      const eventWithFiles = {
        id: 'event-1',
        files: [{ url: '/uploads/file1.pdf' }],
      }

      mockPrisma.healthEvent.findUnique.mockResolvedValue(eventWithFiles)
      mockPrisma.healthEvent.delete.mockResolvedValue({})

      await deleteEvent('event-1', false) // deleteFiles = false

      expect(mockPrisma.healthEvent.delete).toHaveBeenCalledWith({
        where: { id: 'event-1' },
      })
      // Arquivos não devem ser excluídos
    })
  })

  describe('Fluxo Completo CRUD', () => {
    it('deve executar fluxo completo: criar, ler, atualizar, deletar', async () => {
      // Setup inicial
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })

      // 1. Criar profissional
      const professional = {
        id: 'prof-integration',
        name: 'Dr. Integração',
        specialty: 'Clínica Geral',
        userId: 'user-1',
      }
      mockPrisma.professional.create.mockResolvedValue(professional)

      // 2. Criar evento
      const event = {
        id: 'event-integration',
        title: 'Consulta de Integração',
        description: 'Teste completo',
        date: '2025-01-20',
        type: 'CONSULTATION',
        startTime: '09:00',
        endTime: '10:00',
        professionalId: 'prof-integration',
        userId: 'user-1',
        files: [],
      }
      mockPrisma.healthEvent.create.mockResolvedValue(event)

      // 3. Buscar eventos
      mockPrisma.healthEvent.findMany.mockResolvedValue([event])

      // 4. Atualizar evento
      const updatedEvent = { ...event, title: 'Consulta Atualizada' }
      mockPrisma.healthEvent.update.mockResolvedValue(updatedEvent)
      mockPrisma.healthEvent.findUnique.mockResolvedValue(event)

      // 5. Deletar evento
      mockPrisma.healthEvent.delete.mockResolvedValue({})

      // Executar fluxo
      const createdProf = await createProfessional({
        name: 'Dr. Integração',
        specialty: 'Clínica Geral',
        userId: 'user-1',
      })

      const createdEvent = await createEvent({
        title: 'Consulta de Integração',
        description: 'Teste completo',
        date: '2025-01-20',
        type: 'CONSULTATION',
        startTime: '09:00',
        endTime: '10:00',
        professionalId: createdProf.id,
        userId: 'user-1',
        files: [],
      })

      const events = await getEvents('user-1')
      expect(events).toContain(createdEvent)

      const updated = await updateEvent(createdEvent.id, {
        title: 'Consulta Atualizada',
      })
      expect(updated.title).toBe('Consulta Atualizada')

      await deleteEvent(createdEvent.id, false)

      // Verificações finais
      expect(createdProf.id).toBe('prof-integration')
      expect(createdEvent.id).toBe('event-integration')
      expect(events.length).toBeGreaterThan(0)
      expect(updated.title).toBe('Consulta Atualizada')
    })
  })

  describe('Cenários de Erro e Recuperação', () => {
    it('deve lidar com falha na criação de profissional', async () => {
      mockPrisma.professional.create.mockRejectedValue(
        new Error('Database error')
      )

      await expect(
        createProfessional({
          name: 'Dr. Teste',
          specialty: 'Cardiologia',
          userId: 'user-1',
        })
      ).rejects.toThrow('Database error')
    })

    it('deve lidar com falha na criação de evento', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
      mockPrisma.healthEvent.create.mockRejectedValue(
        new Error('Validation error')
      )

      await expect(
        createEvent({
          title: 'Evento Teste',
          description: 'Descrição',
          date: '2025-01-15',
          type: 'CONSULTATION',
          startTime: '10:00',
          endTime: '11:00',
          professionalId: 'prof-1',
          userId: 'user-1',
          files: [],
        })
      ).rejects.toThrow('Validation error')
    })

    it('deve validar dados obrigatórios em todos os serviços', async () => {
      // Teste de criação de evento sem dados obrigatórios
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })

      await expect(
        createEvent({
          title: '',
          description: '',
          date: '',
          type: 'CONSULTATION',
          startTime: '',
          endTime: '',
          professionalId: '',
          userId: 'user-1',
          files: [],
        })
      ).rejects.toThrow()
    })
  })
})
