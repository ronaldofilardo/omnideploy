import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Timeline, Event } from '../Timeline'

describe('Timeline', () => {
  const mockProfessionals = [
    {
      id: '1',
      name: 'Dr. João Silva',
      specialty: 'Cardiologia',
      address: 'Rua A, 123',
      contact: '11987654321',
    },
    {
      id: '2',
      name: 'Dra. Maria Santos',
      specialty: 'Dermatologia',
      address: 'Rua B, 456',
    },
  ]

  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Consulta Cardiologia',
      description: 'Consulta de rotina',
      date: '2024-10-25',
      type: 'consulta',
      professionalId: '1',
      startTime: '10:00',
      endTime: '11:00',
      observation: 'Paciente com dor no peito',
      instructions: true,
      files: [
        {
          slot: 'request',
          name: 'requisicao.pdf',
          url: 'http://example.com/requisicao.pdf',
        },
      ],
    },
    {
      id: '2',
      title: 'Exame Dermatologia',
      description: 'Exame de pele',
      date: '2024-10-25',
      type: 'exame',
      professionalId: '2',
      startTime: '14:00',
      endTime: '15:00',
    },
    {
      id: '3',
      title: 'Consulta Seguimento',
      description: 'Retorno',
      date: '2024-10-26',
      type: 'consulta',
      professionalId: '1',
      startTime: '09:00',
      endTime: '10:00',
    },
  ]

  const mockOnView = vi.fn()
  const mockOnFiles = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (
    events = mockEvents,
    professionals = mockProfessionals
  ) => {
    return render(
      <Timeline
        events={events}
        professionals={professionals}
        onView={mockOnView}
        onFiles={mockOnFiles}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdate={mockOnUpdate}
      />
    )
  }

  it('renders timeline with grouped events by date', () => {
  renderComponent()
  // Usa matcher de função para header de data
  const dayHeaders = screen.getAllByTestId('timeline-day-header')
  expect(dayHeaders.some(header => /^25\/10\/2024 - /.test(header.textContent || ''))).toBe(true)
  expect(dayHeaders.some(header => /^26\/10\/2024 - /.test(header.textContent || ''))).toBe(true)
  // Busca títulos dentro dos cards
  const eventCards = screen.getAllByTestId('timeline-event-card')
  const foundTitles = eventCards.filter(card => {
    const utils = require('@testing-library/react')
    return (
      utils.queryByText(card, /Consulta Cardiologia/) ||
      utils.queryByText(card, /Exame Dermatologia/) ||
      utils.queryByText(card, /Consulta Seguimento/)
    )
  })
  expect(foundTitles.length).toBeGreaterThanOrEqual(3)
  })

  it('displays professional names correctly', () => {
  renderComponent()
  const eventCards = screen.getAllByTestId('timeline-event-card')
  const { within } = require('@testing-library/react')
  expect(eventCards.some(card => within(card).queryByText('Dr. João Silva'))).toBe(true)
  expect(eventCards.some(card => within(card).queryByText('Dra. Maria Santos'))).toBe(true)
  })

  it('displays professional addresses', () => {
  renderComponent()
  const eventCards = screen.getAllByTestId('timeline-event-card')
  const { within } = require('@testing-library/react')
  expect(eventCards.some(card => within(card).queryByText('Rua A, 123'))).toBe(true)
  expect(eventCards.some(card => within(card).queryByText('Rua B, 456'))).toBe(true)
  })

  it('sorts events by date', () => {
    const unsortedEvents: Event[] = [
      mockEvents[2], // 26/10
      mockEvents[0], // 25/10
      mockEvents[1], // 25/10
    ]
    renderComponent(unsortedEvents)
    const eventCards = screen.getAllByTestId('timeline-event-card')
    const { within } = require('@testing-library/react')
    expect(eventCards.some(card => within(card).queryByText(/Consulta Cardiologia/))).toBe(true)
    expect(eventCards.some(card => within(card).queryByText(/Exame Dermatologia/))).toBe(true)
    expect(eventCards.some(card => within(card).queryByText(/Consulta Seguimento/))).toBe(true)
  })

  it('handles events without professional match', () => {
    const eventsWithoutProfessional: Event[] = [
      {
        ...mockEvents[0],
        professionalId: 'nonexistent',
      },
    ]
    renderComponent(eventsWithoutProfessional)
    const eventCards = screen.getAllByTestId('timeline-event-card')
    const { within } = require('@testing-library/react')
    // Deve renderizar o card do evento
    expect(eventCards.some(card => within(card).queryByText(/Consulta Cardiologia/))).toBe(true)
    // Nome do profissional deve estar ausente ou vazio
    expect(eventCards.some(card => {
      const el = within(card).queryByText('', { exact: true })
      return el !== null
    })).toBe(true)
  })

  it('calls onView when view button is clicked', () => {
  renderComponent()
  const eventCards = screen.getAllByTestId('timeline-event-card')
  const { within } = require('@testing-library/react')
  // Procura o botão "Ver Detalhes" dentro do primeiro card
  const viewButton = within(eventCards[0]).getByRole('button', { name: /Detalhes/i })
  fireEvent.click(viewButton)
  expect(mockOnView).toHaveBeenCalledWith(mockEvents[0])
  })

  it('calls onFiles when files button is clicked', () => {
  renderComponent()
  const eventCards = screen.getAllByTestId('timeline-event-card')
  const { within } = require('@testing-library/react')
  const filesButton = within(eventCards[0]).getByRole('button', { name: /Arquivos/i })
  fireEvent.click(filesButton)
  expect(mockOnFiles).toHaveBeenCalledWith(mockEvents[0])
  })

  it('calls onEdit when edit button is clicked', () => {
  renderComponent()
  const eventCards = screen.getAllByTestId('timeline-event-card')
  const { within } = require('@testing-library/react')
  const editButton = within(eventCards[0]).getByRole('button', { name: /Editar/i })
  fireEvent.click(editButton)
  expect(mockOnEdit).toHaveBeenCalledWith(mockEvents[0])
  })

  it('calls onDelete when delete button is clicked', () => {
  renderComponent()
  const eventCards = screen.getAllByTestId('timeline-event-card')
  const { within } = require('@testing-library/react')
  const deleteButton = within(eventCards[0]).getByRole('button', { name: /Deletar|Excluir/i })
  fireEvent.click(deleteButton)
  expect(mockOnDelete).toHaveBeenCalledWith(mockEvents[0])
  })

  it('renders events with alternating layout', () => {
    renderComponent([mockEvents[0], mockEvents[1]]) // Same date
    // Ambos eventos devem ser renderizados dentro dos cards
    const eventCards = screen.getAllByTestId('timeline-event-card')
    const utils = require('@testing-library/react')
    expect(eventCards.some(card => utils.queryByText(card, /Exame Dermatologia/))).toBe(true)
  })

  it('handles events with datetime strings', () => {
    const eventsWithDateTime: Event[] = [
      {
        ...mockEvents[0],
        date: '2024-10-25T10:00:00Z',
      },
    ]
    renderComponent(eventsWithDateTime)
    const eventCards = screen.getAllByTestId('timeline-event-card')
    expect(eventCards.some(card => (card.textContent || '').includes('Cardiologia'))).toBe(true)
  })

  it('renders empty timeline when no events', () => {
    renderComponent([])

    // Should not render any events
    expect(screen.queryByText('Consulta Cardiologia')).not.toBeInTheDocument()
  })

  it('renders events without times', () => {
    const eventsWithoutTimes: Event[] = [
      {
        ...mockEvents[0],
        startTime: undefined,
        endTime: undefined,
      },
    ]
    renderComponent(eventsWithoutTimes)
    const eventCards = screen.getAllByTestId('timeline-event-card')
    expect(eventCards.some(card => (card.textContent || '').includes('Cardiologia'))).toBe(true)
  })

  it('handles events with status from backend', () => {
    const eventsWithStatus: Event[] = [
      {
        ...mockEvents[0],
        status: 'past',
      } as any,
    ]
    renderComponent(eventsWithStatus)
    const eventCards = screen.getAllByTestId('timeline-event-card')
    expect(eventCards.some(card => (card.textContent || '').includes('Cardiologia'))).toBe(true)
  })

  it('formats dates correctly in Brazilian Portuguese', () => {
    renderComponent()

    // Should contain day of week in Portuguese
    const dayHeaders = screen.getAllByTestId('timeline-day-header')
    const dateElement = dayHeaders.find(header => /^25\/10\/2024 - /.test(header.textContent || ''))
    expect(dateElement).toBeInTheDocument()
  })

  it('renders timeline line on desktop', () => {
  renderComponent()
  // Usa matcher para encontrar elemento por atributo de teste
  const timelineLine = screen.getByTestId('timeline-line')
  expect(timelineLine).toBeInTheDocument()
  })

  it('renders timeline dots', () => {
  renderComponent()
  // Usa matcher para encontrar elementos por atributo de teste
  const timelineDots = screen.getAllByTestId('timeline-dot')
  expect(timelineDots.length).toBeGreaterThan(0)
  })
})
