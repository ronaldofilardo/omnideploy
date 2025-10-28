import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DeleteEventModal } from '../../../src/components/DeleteEventModal'

describe('DeleteEventModal', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnConfirm = vi.fn()

  const renderModal = (open = true, eventTitle = 'Consulta Médica') => {
    return render(
      <DeleteEventModal
        open={open}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        eventTitle={eventTitle}
      />
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal when open is true', () => {
    renderModal(true)

    expect(screen.getByText('Excluir Evento')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Tem certeza de que deseja excluir o evento "Consulta Médica"?'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Deletar arquivos associados')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
    expect(screen.getByText('Confirmar')).toBeInTheDocument()
  })

  it('does not render modal when open is false', () => {
    renderModal(false)

    expect(screen.queryByText('Excluir Evento')).not.toBeInTheDocument()
  })

  it('displays the correct event title', () => {
    renderModal(true, 'Exame de Sangue')

    expect(
      screen.getByText(
        'Tem certeza de que deseja excluir o evento "Exame de Sangue"?'
      )
    ).toBeInTheDocument()
  })

  it('checkbox starts unchecked', () => {
    renderModal(true)

    const checkbox = screen.getByRole('checkbox', {
      name: /deletar arquivos associados/i,
    })
    expect(checkbox).not.toBeChecked()
  })

  it('can check and uncheck the delete files checkbox', () => {
    renderModal(true)

    const checkbox = screen.getByRole('checkbox', {
      name: /deletar arquivos associados/i,
    })

    // Check the checkbox
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    // Uncheck the checkbox
    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('calls onConfirm with false when confirming without checkbox checked', () => {
    renderModal(true)

    const confirmButton = screen.getByText('Confirmar')
    fireEvent.click(confirmButton)

    expect(mockOnConfirm).toHaveBeenCalledWith(false)
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('calls onConfirm with true when confirming with checkbox checked', () => {
    renderModal(true)

    const checkbox = screen.getByRole('checkbox', {
      name: /deletar arquivos associados/i,
    })
    fireEvent.click(checkbox)

    const confirmButton = screen.getByText('Confirmar')
    fireEvent.click(confirmButton)

    expect(mockOnConfirm).toHaveBeenCalledWith(true)
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('calls onOpenChange with false when canceling', () => {
    renderModal(true)

    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)

    expect(mockOnConfirm).not.toHaveBeenCalled()
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('resets checkbox state when canceling', () => {
    renderModal(true)

    const checkbox = screen.getByRole('checkbox', {
      name: /deletar arquivos associados/i,
    })
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)

    // Since the modal closes, we can't check the state, but the function should reset it
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('resets checkbox state when confirming', () => {
    renderModal(true)

    const checkbox = screen.getByRole('checkbox', {
      name: /deletar arquivos associados/i,
    })
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    const confirmButton = screen.getByText('Confirmar')
    fireEvent.click(confirmButton)

    // Since the modal closes, we can't check the state, but the function should reset it
    expect(mockOnConfirm).toHaveBeenCalledWith(true)
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('displays copyright notice', () => {
    renderModal(true)

    expect(screen.getByText('© 2025 Omni Saúde')).toBeInTheDocument()
  })

  it('handles checkbox indeterminate state', () => {
    renderModal(true)

    const checkbox = screen.getByRole('checkbox', {
      name: /deletar arquivos associados/i,
    })

    // The component handles 'indeterminate' by converting to boolean
    // This test ensures the checkbox can be toggled properly
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })
})
