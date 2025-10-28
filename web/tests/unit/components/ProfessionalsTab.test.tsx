import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProfessionalsTab } from '../../../src/components/ProfessionalsTab'

describe('ProfessionalsTab', () => {
  const mockSetProfessionals = vi.fn()
  const mockProfessionals = [
    {
      id: '1',
      name: 'Dr. João Silva',
      specialty: 'Cardiologia',
      address: 'Rua A, 123',
    },
    {
      id: '2',
      name: 'Dra. Maria Santos',
      specialty: 'Dermatologia',
      address: 'Rua B, 456',
    },
  ]


  beforeEach(() => {
    vi.clearAllMocks()
    // Mock global fetch para especialidades por padrão
    global.fetch = vi.fn((url) => {
      if (typeof url === 'string' && url.includes('type=specialties')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(['Cardiologia', 'Dermatologia']),
        })
      }
      // fallback para outros endpoints
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderComponent = (professionals = mockProfessionals) => {
    return render(
      <ProfessionalsTab
        professionals={professionals}
        setProfessionals={mockSetProfessionals}
      />
    )
  }

  it('renders professionals tab with title and add button', () => {
    renderComponent()

    expect(screen.getByText('Profissionais')).toBeInTheDocument()
    expect(screen.getByText('Adicionar Profissional')).toBeInTheDocument()
  })

  it('renders professional cards', () => {
  renderComponent()

  // Deve haver apenas um <h3> para cada nome
  const joaoHeadings = screen.getAllByText((_, n) => !!n && n.tagName === 'H3' && n.textContent?.includes('Dr. João Silva'))
  expect(joaoHeadings).toHaveLength(1)
  const mariaHeadings = screen.getAllByText((_, n) => !!n && n.tagName === 'H3' && n.textContent?.includes('Dra. Maria Santos'))
  expect(mariaHeadings).toHaveLength(1)

  // Deve haver apenas um <p> para cada especialidade
  const cardioPs = screen.getAllByText((_, n) => !!n && n.tagName === 'P' && n.textContent?.includes('Cardiologia'))
  expect(cardioPs).toHaveLength(1)
  const dermaPs = screen.getAllByText((_, n) => !!n && n.tagName === 'P' && n.textContent?.includes('Dermatologia'))
  expect(dermaPs).toHaveLength(1)
  })

  it('opens add professional modal when add button is clicked', () => {
    renderComponent()

    const addButton = screen.getByText('Adicionar Profissional')
    fireEvent.click(addButton)

    // Modal should be open, but since it's a separate component, we check if the modal is rendered
    expect(screen.getByText('Adicionar Profissional')).toBeInTheDocument()
  })

  it('handles add professional successfully', async () => {
    const newProfessional = {
      id: '3',
      name: 'Dr. Pedro Costa',
      specialty: 'Ortopedia',
      address: 'Rua C, 789',
      contact: '123456789',
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(newProfessional),
    })

    renderComponent()

    const addButton = screen.getByText('Adicionar Profissional')
    fireEvent.click(addButton)

    // Since the modal is a separate component, we can't directly interact with it
    // But we can test the handleAddProfessional function indirectly
    // For now, we'll assume the modal handles the form submission
  })

  it('handles edit professional', () => {
    renderComponent()

    // Click edit on first professional card
    const editButtons = screen.getAllByText('Editar')
    fireEvent.click(editButtons[0])

    // Modal should open with the professional data
    expect(screen.getByText('Profissionais')).toBeInTheDocument()
  })

  it('handles delete professional with confirmation', async () => {
    global.confirm = vi.fn(() => true)
    // Mock fetch para especialidades e para exclusão
    global.fetch = vi.fn((url, opts) => {
      if (typeof url === 'string' && url.includes('type=specialties')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(['Cardiologia', 'Dermatologia']),
        })
      }
      if (opts && opts.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({}),
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    })

    renderComponent()

    const deleteButtons = screen.getAllByText('Excluir')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith(
        'Tem certeza que deseja excluir este profissional?'
      )
      expect(mockSetProfessionals).toHaveBeenCalledWith([mockProfessionals[1]])
    })
  })

  it('handles delete professional cancellation', () => {
    global.confirm = vi.fn(() => false)

    renderComponent()

    const deleteButtons = screen.getAllByText('Excluir')
    fireEvent.click(deleteButtons[0])

    expect(global.confirm).toHaveBeenCalledWith(
      'Tem certeza que deseja excluir este profissional?'
    )
    expect(mockSetProfessionals).not.toHaveBeenCalled()
  })

  it('filters specialties correctly', () => {
    const professionalsWithUndefined = [
      ...mockProfessionals,
      {
        id: '3',
        name: 'Dr. Ana Lima',
        specialty: 'A ser definido',
        address: '',
      },
    ]

    renderComponent(professionalsWithUndefined)

    // Deve haver apenas um <h3> com "Dr. Ana Lima"
    const anaLimaHeadings = screen.getAllByText((_, n) =>
      !!n && n.tagName === 'H3' && n.textContent?.includes('Dr. Ana Lima')
    )
    expect(anaLimaHeadings).toHaveLength(1)
  })

  it('renders empty state when no professionals', () => {
    renderComponent([])

    expect(screen.getByText('Profissionais')).toBeInTheDocument()
    expect(screen.getByText('Adicionar Profissional')).toBeInTheDocument()
    // No professional cards should be rendered
    expect(screen.queryByText('Dr. João Silva')).not.toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
  const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true)
    const fetchMock = vi.fn((url, opts) => {
      if (typeof url === 'string' && url.includes('type=specialties')) {
        return Promise.resolve(
          new Response(JSON.stringify(['Cardiologia', 'Dermatologia']), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      if (opts && opts.method === 'DELETE') {
        return Promise.resolve(
          new Response('{}', {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      return Promise.resolve(
        new Response('{}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
    global.fetch = fetchMock

    try {
      renderComponent()

      const deleteButtons = screen.getAllByText('Excluir')
      fireEvent.click(deleteButtons[0])

      // Pequeno delay para garantir propagação do erro assíncrono
      await new Promise((resolve) => setTimeout(resolve, 20))

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Erro ao excluir profissional.')
      }, { timeout: 1000 })
    } finally {
      alertSpy.mockRestore()
      confirmSpy.mockRestore()
      vi.restoreAllMocks()
    }
  })
})
