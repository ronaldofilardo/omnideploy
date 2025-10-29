import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import CreateEventFromNotificationModal from '@/components/CreateEventFromNotificationModal'
import { ProfessionalsTab } from '@/components/ProfessionalsTab'
import { Timeline } from '@/components/Timeline'

// Mock do fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Fluxo de Criação de Evento via Laudo (Integração)', () => {
  const mockUserId = 'test-user-id'
  const mockDoctorName = 'Dr. Teste Integração'
  const mockProfessionalId = 'test-prof-id'
  const mockEventId = 'test-event-id'

  const mockNotification = {
    id: 'notification-1',
    payload: {
      doctorName: mockDoctorName,
      examDate: '2025-11-01',
      report: {
        fileName: 'laudo.jpg',
        fileContent: 'test'
      }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('/api/professionals')) {
        // Criação do profissional
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            id: mockProfessionalId,
            name: mockDoctorName,
            specialty: 'A ser definido'
          })
        })
      }
      if (typeof url === 'string' && url.includes('/api/events')) {
        // Criação do evento
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            id: mockEventId,
            title: 'Laudo: laudo.jpg',
            professionalId: mockProfessionalId
          })
        })
      }
      // Busca de profissionais
      return Promise.resolve({
        ok: true,
        json: async () => ([{
          id: mockProfessionalId,
          name: mockDoctorName,
          specialty: 'A ser definido'
        }])
      })
    })
  })

  // eslint-disable-next-line vitest/no-disabled-tests
  it.skip('cria profissional, exibe na aba e mostra nome no card da timeline', async () => {
    const onSuccess = vi.fn()
    const refreshProfessionals = vi.fn()

    // 1. Renderizar e interagir com o modal
    const { rerender } = render(
      <CreateEventFromNotificationModal
        open={true}
        onClose={() => {}}
        onSuccess={onSuccess}
        notification={mockNotification}
        userId={mockUserId}
        refreshProfessionals={refreshProfessionals}
        professionalId=""
      />
    )

    // Clicar no botão de criar
    const createButton = screen.getByText('Criar Evento')
    fireEvent.click(createButton)

    // Verificar se as chamadas à API foram feitas corretamente
    await waitFor(() => {
      const calls = mockFetch.mock.calls.map(call => call[0])
      expect(calls.some(url => url.includes('/api/professionals'))).toBe(true)
      expect(calls.some(url => url.includes('/api/events'))).toBe(true)
    })

    // 2. Verificar se o profissional aparece na aba Profissionais
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([{
        id: mockProfessionalId,
        name: mockDoctorName,
        specialty: 'A ser definido'
      }])
    })

    render(
      <ProfessionalsTab
        professionals={[{
          id: mockProfessionalId,
          name: mockDoctorName,
          specialty: 'A ser definido'
        }]}
        setProfessionals={() => {}}
        userId={mockUserId}
      />
    )

    expect(screen.getByText(mockDoctorName)).toBeInTheDocument()

    // 3. Verificar se o nome aparece no card da timeline
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([{
        id: mockEventId,
        title: 'Laudo: laudo.jpg',
        type: 'EXAME',
        professionalId: mockProfessionalId,
        date: '2025-11-01',
        startTime: '09:00',
        endTime: '09:30'
      }])
    })

    render(
      <Timeline
        events={[{
          id: mockEventId,
          title: 'Laudo: laudo.jpg',
          type: 'EXAME',
          professionalId: mockProfessionalId,
          date: '2025-11-01',
          startTime: '09:00',
          endTime: '09:30'
        }]}
        professionals={[{
          id: mockProfessionalId,
          name: mockDoctorName,
          specialty: 'A ser definido'
        }]}
      />
    )

    // Verificar se o nome do profissional aparece no card
    expect(screen.getByText(new RegExp(mockDoctorName))).toBeInTheDocument()
  })
})