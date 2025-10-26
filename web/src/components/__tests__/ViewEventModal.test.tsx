import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ViewEventModal } from '../ViewEventModal'

describe('ViewEventModal', () => {
  const mockOnOpenChange = vi.fn()

  const mockEvent = {
    id: '1',
    title: 'Consulta Médica',
    description: 'Consulta de rotina',
    date: '2024-01-01',
    type: 'CONSULTATION',
    professionalId: 'prof-1',
    startTime: '10:00',
    endTime: '11:00',
    observation: 'Teste',
  }

  const mockProfessional = {
    id: 'prof-1',
    name: 'Dr. Silva',
    specialty: 'Cardiologia',
    address: 'Rua A',
    contact: '123',
  }

  const renderModal = (
    open = true,
    event = mockEvent,
    professional = mockProfessional
  ) => {
    return render(
      <ViewEventModal
        open={open}
        onOpenChange={mockOnOpenChange}
        event={event}
        professional={professional}
      />
    )
  }

  it('renders modal when open is true and event/professional exist', () => {
  renderModal(true)

  // Usa matcher de função para evitar múltiplos matches
  expect(screen.getAllByText((content, node) => node?.tagName === 'H2' && /Detalhes do Evento/.test(content)).length).toBeGreaterThan(0)
  expect(screen.getByText('Consulta', { selector: 'p' })).toBeInTheDocument()
  expect(screen.getByText('Dr. Silva - Cardiologia', { selector: 'p' })).toBeInTheDocument()
  // Aceita qualquer data formatada corretamente
  expect(screen.getByText((content, node) => node?.tagName === 'P' && /^\d{2}\/\d{2}\/\d{4}$/.test(content))).toBeInTheDocument()
  expect(screen.getByText('10:00 - 11:00', { selector: 'p' })).toBeInTheDocument()
  expect(screen.getByText('Teste', { selector: 'p' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /OK/i })).toBeInTheDocument()
  })

  it('does not render modal when open is false', () => {
    renderModal(false)

    expect(screen.queryByText('Detalhes do Evento')).not.toBeInTheDocument()
  })

  it('does not render modal when event is null', () => {
    renderModal(true, null, mockProfessional)

    expect(screen.queryByText('Detalhes do Evento')).not.toBeInTheDocument()
  })

  it('does not render modal when professional is null', () => {
    renderModal(true, mockEvent, null)

    expect(screen.queryByText('Detalhes do Evento')).not.toBeInTheDocument()
  })

  it('formats date correctly', () => {
  renderModal(true)
  // Aceita qualquer data formatada corretamente
  expect(screen.getByText((content, node) => node?.tagName === 'P' && /^\d{2}\/\d{2}\/\d{4}$/.test(content))).toBeInTheDocument()
  })

  it('displays event type label correctly', () => {
  renderModal(true)
  expect(screen.getByText('Consulta', { selector: 'p' })).toBeInTheDocument()
  })

  it('displays professional information correctly', () => {
  renderModal(true)
  expect(screen.getByText('Dr. Silva - Cardiologia', { selector: 'p' })).toBeInTheDocument()
  })

  it('displays time range correctly', () => {
  renderModal(true)
  expect(screen.getByText('10:00 - 11:00', { selector: 'p' })).toBeInTheDocument()
  })

  it('displays observation when present', () => {
  renderModal(true)
  expect(screen.getByText('Teste', { selector: 'p' })).toBeInTheDocument()
  })

  it('does not display observation when not present', () => {
    const eventWithoutObservation = { ...mockEvent, observation: undefined }
    renderModal(true, eventWithoutObservation)

    expect(screen.queryByText('Observação')).not.toBeInTheDocument()
  })

  it('closes modal when OK button is clicked', () => {
  renderModal(true)
  const okButton = screen.getByRole('button', { name: /OK/i })
  fireEvent.click(okButton)
  expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('handles different event types', () => {
    const examEvent = { ...mockEvent, type: 'EXAM' }
    renderModal(true, examEvent)

    expect(screen.getByText('Exame')).toBeInTheDocument()
  })

  it('handles unknown event types', () => {
    const unknownEvent = { ...mockEvent, type: 'UNKNOWN' }
    renderModal(true, unknownEvent)

    expect(screen.getByText('UNKNOWN')).toBeInTheDocument()
  })

  it('displays copyright notice', () => {
    renderModal(true)

    expect(screen.getByText('© 2025 Omni Saúde')).toBeInTheDocument()
  })
})
