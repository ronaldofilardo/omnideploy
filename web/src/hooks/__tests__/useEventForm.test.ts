import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEventForm } from '../useEventForm'

// Mock do prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    healthEvent: {
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock do router do Next.js
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('useEventForm', () => {
  const mockProfessionals = [
    { id: 'prof-1', name: 'Dr. João Silva', specialty: 'Cardiologia' },
    { id: 'prof-2', name: 'Dra. Maria Santos', specialty: 'Dermatologia' },
  ]

  const mockOnFormSubmitSuccess = vi.fn()

  const defaultProps = {
    professionals: mockProfessionals,
    onFormSubmitSuccess: mockOnFormSubmitSuccess,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock da API de eventos: sempre retorna um objeto com json()
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    }))
  })

  describe('Estado inicial', () => {
    it('deve inicializar com valores vazios', () => {
      const { result } = renderHook(() => useEventForm(defaultProps))

      expect(result.current.formState).toEqual({
        eventType: '',
        selectedProfessional: '',
        date: '',
        startTime: '',
        endTime: '',
        observation: '',
      })
      expect(result.current.errors).toEqual({})
      expect(result.current.professionalOptions).toBe(mockProfessionals)
    })
  })

  describe('Atualização de campos', () => {
    it('deve atualizar campo de texto', () => {
      const { result } = renderHook(() => useEventForm(defaultProps))

      act(() => {
        result.current.handleFieldChange('observation', 'Nova observação')
      })

      expect(result.current.formState.observation).toBe('Nova observação')
    })

    it('deve atualizar campo de seleção', () => {
      const { result } = renderHook(() => useEventForm(defaultProps))

      act(() => {
  result.current.handleFieldChange('eventType', 'CONSULTA')
      })

  expect(result.current.formState.eventType).toBe('CONSULTA')
    })

    it('deve limpar erros ao atualizar campo', () => {
      const { result } = renderHook(() => useEventForm(defaultProps))

      // Simular erro
      act(() => {
        result.current.setErrors({ date: 'Erro de teste' })
      })

      expect(result.current.errors.date).toBe('Erro de teste')

      // Atualizar campo deve limpar erro
      act(() => {
        result.current.handleFieldChange('date', '2025-01-16')
      })

      expect(result.current.errors.date).toBeUndefined()
    })
  })

  describe('Validação', () => {
    it('deve validar campos obrigatórios na submissão', async () => {
      const { result } = renderHook(() => useEventForm(defaultProps))

      const mockEvent = {
        preventDefault: vi.fn(),
      }

      await act(async () => {
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(result.current.errors.eventType).toBeDefined()
      expect(result.current.errors.selectedProfessional).toBeDefined()
      expect(result.current.errors.date).toBeDefined()
      expect(result.current.errors.startTime).toBeDefined()
    })

    it('deve validar formato de data', async () => {
      const { result } = renderHook(() => useEventForm(defaultProps))

      act(() => {
        result.current.handleFieldChange('date', 'invalid-date')
  result.current.handleFieldChange('eventType', 'CONSULTA')
        result.current.handleFieldChange('selectedProfessional', 'prof-1')
        result.current.handleFieldChange('startTime', '10:00')
        result.current.handleFieldChange('endTime', '11:00')
      })

      const mockEvent = { preventDefault: vi.fn() }

      await act(async () => {
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(result.current.errors.date).toContain('Formato de data inválido')
    })

    it('deve validar horário de fim maior que início', async () => {
      const { result } = renderHook(() => useEventForm(defaultProps))

      act(() => {
        result.current.handleFieldChange('date', '2025-01-16')
  result.current.handleFieldChange('eventType', 'CONSULTA')
        result.current.handleFieldChange('selectedProfessional', 'prof-1')
        result.current.handleFieldChange('startTime', '11:00')
        result.current.handleFieldChange('endTime', '10:00')
      })

      const mockEvent = { preventDefault: vi.fn() }

      await act(async () => {
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(result.current.errors.endTime).toContain('maior que o de início')
    })
  })

  describe('Submissão', () => {
    it('deve impedir submissão com erros de validação', async () => {
      const { result } = renderHook(() => useEventForm(defaultProps))

      const mockEvent = { preventDefault: vi.fn() }

      await act(async () => {
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(mockOnFormSubmitSuccess).not.toHaveBeenCalled()
    })

    it('deve submeter formulário válido', async () => {
      // Mock da resposta da API
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({}) }
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useEventForm(defaultProps))

      // Preencher formulário válido
      act(() => {
  result.current.handleFieldChange('eventType', 'CONSULTA')
        result.current.handleFieldChange('selectedProfessional', 'prof-1')
        result.current.handleFieldChange('date', '2025-01-16')
        result.current.handleFieldChange('startTime', '10:00')
        result.current.handleFieldChange('endTime', '11:00')
        result.current.handleFieldChange('observation', 'Consulta de rotina')
      })

      const mockEvent = { preventDefault: vi.fn() }

      await act(async () => {
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'CONSULTA',
          description: 'Consulta de rotina',
          date: '2025-01-16',
          type: 'CONSULTA',
          startTime: '10:00',
          endTime: '11:00',
          professionalId: 'prof-1',
          files: [],
        }),
      })

      expect(mockOnFormSubmitSuccess).toHaveBeenCalled()
    })

    it('deve lidar com erro na API', async () => {
      // Mock de erro na API
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'Erro na API' }),
      }
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useEventForm(defaultProps))

      // Preencher formulário válido
      act(() => {
  result.current.handleFieldChange('eventType', 'CONSULTA')
        result.current.handleFieldChange('selectedProfessional', 'prof-1')
        result.current.handleFieldChange('date', '2025-01-16')
        result.current.handleFieldChange('startTime', '10:00')
        result.current.handleFieldChange('endTime', '11:00')
      })

      const mockEvent = { preventDefault: vi.fn() }

      await act(async () => {
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(result.current.errors.overlap).toBe('Erro na API')
      expect(mockOnFormSubmitSuccess).not.toHaveBeenCalled()
    })

    it('deve lidar com erro de rede', async () => {
      // Mock de erro de rede
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useEventForm(defaultProps))

      // Preencher formulário válido
      act(() => {
  result.current.handleFieldChange('eventType', 'CONSULTA')
        result.current.handleFieldChange('selectedProfessional', 'prof-1')
        result.current.handleFieldChange('date', '2025-01-16')
        result.current.handleFieldChange('startTime', '10:00')
        result.current.handleFieldChange('endTime', '11:00')
      })

      const mockEvent = { preventDefault: vi.fn() }

      await act(async () => {
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(result.current.errors.overlap).toContain('Falha na comunicação')
    })
  })

  describe('Validação de sobreposição', () => {
    it('deve detectar sobreposição de eventos', async () => {
      // Mock de eventos existentes
      const mockEventsResponse = [
        {
          id: '1',
          professionalId: 'prof-1',
          date: '2025-01-16T00:00:00.000Z',
          startTime: '10:00',
          endTime: '11:00',
        },
      ]
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockEventsResponse),
      })

      const { result } = renderHook(() => useEventForm(defaultProps))

      // Aguardar carregamento de eventos
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // Tentar criar evento sobreposto
      act(() => {
  result.current.handleFieldChange('eventType', 'EXAME')
        result.current.handleFieldChange('selectedProfessional', 'prof-1')
        result.current.handleFieldChange('date', '2025-01-16')
        result.current.handleFieldChange('startTime', '10:30')
        result.current.handleFieldChange('endTime', '11:30')
      })

      const mockEvent = { preventDefault: vi.fn() }

      await act(async () => {
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(result.current.errors.overlap).toContain('Conflito')
    })

    it('deve permitir eventos não sobrepostos', async () => {
      // Mock de eventos existentes
      const mockEventsResponse = [
        {
          id: '1',
          professionalId: 'prof-1',
          date: '2025-01-16T00:00:00.000Z',
          startTime: '10:00',
          endTime: '11:00',
        },
      ]
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockEventsResponse),
      })

      // Mock de resposta de sucesso
      const mockSuccessResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      }
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockEventsResponse),
        })
        .mockResolvedValueOnce(mockSuccessResponse)

      const { result } = renderHook(() => useEventForm(defaultProps))

      // Aguardar carregamento de eventos
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // Criar evento não sobreposto
      act(() => {
  result.current.handleFieldChange('eventType', 'EXAME')
        result.current.handleFieldChange('selectedProfessional', 'prof-1')
        result.current.handleFieldChange('date', '2025-01-16')
        result.current.handleFieldChange('startTime', '14:00')
        result.current.handleFieldChange('endTime', '15:00')
      })

      const mockEvent = { preventDefault: vi.fn() }

      await act(async () => {
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(result.current.errors.overlap).toBeUndefined()
      expect(mockOnFormSubmitSuccess).toHaveBeenCalled()
    })
  })

  describe('Cenários de borda', () => {
    it('deve resetar formulário após submissão bem-sucedida', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({}) }
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useEventForm(defaultProps))

      // Preencher formulário
      act(() => {
  result.current.handleFieldChange('eventType', 'CONSULTA')
        result.current.handleFieldChange('selectedProfessional', 'prof-1')
        result.current.handleFieldChange('date', '2025-01-16')
        result.current.handleFieldChange('startTime', '10:00')
        result.current.handleFieldChange('endTime', '11:00')
        result.current.handleFieldChange('observation', 'Teste')
      })

      const mockEvent = { preventDefault: vi.fn() }

      await act(async () => {
        await result.current.handleSubmit(mockEvent as any)
      })

      // Verificar se formulário foi resetado
      expect(result.current.formState.eventType).toBe('')
      expect(result.current.formState.observation).toBe('')
    })

    it('deve atualizar lista de eventos ao chamar refreshEvents', async () => {
      const newEvents = [
        {
          id: '2',
          professionalId: 'prof-2',
          date: '2025-01-17T00:00:00.000Z',
          startTime: '09:00',
          endTime: '10:00',
        },
      ]
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(newEvents),
      })

      const { result } = renderHook(() => useEventForm(defaultProps))

      act(() => {
        result.current.refreshEvents()
      })

      // Aguardar atualização
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // Verificar se fetch foi chamado novamente
      expect(global.fetch).toHaveBeenCalledWith('/api/events')
    })
  })
})
