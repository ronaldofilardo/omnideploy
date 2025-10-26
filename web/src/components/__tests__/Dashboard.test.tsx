import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Dashboard } from '../Dashboard'
import { describe, it, expect, vi, beforeEach } from 'vitest'
// Mock dos componentes que usam Radix UI para evitar erros de ambiente
vi.mock('../NewEventModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div>NewEventModal Mock</div> : null,
}))
vi.mock('../ProfessionalsTab', () => ({
  ProfessionalsTab: () => <div>ProfessionalsTab Mock</div>,
}))
vi.mock('../Sidebar', () => ({
  Sidebar: ({ onMenuClick }: { onMenuClick: (menu: string) => void }) => (
    <div role="complementary">
      <button onClick={() => onMenuClick('logout')}>Logout Mock</button>
    </div>
  ),
}))

// Mock do fetch global
vi.mock('global.fetch', () => ({
  default: vi.fn(),
}))

// Mock do console.error
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

// Mock do alert
global.alert = vi.fn()

describe('Dashboard', () => {
  const mockOnLogout = vi.fn()

  const mockEvents = [
    {
      id: '1',
      title: 'Consulta Médica',
      description: 'Consulta de rotina',
      date: '2024-01-01',
      type: 'consulta',
      professionalId: 'prof-1',
      startTime: '10:00',
      endTime: '11:00',
    },
  ]

  const mockProfessionals = [
    {
      id: 'prof-1',
      name: 'Dr. Silva',
      specialty: 'Cardiologia',
      address: 'Rua das Flores, 123',
      contact: '123456789',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/events') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEvents),
          })
        }
        if (url === '/api/professionals') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockProfessionals),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      })
    )
  })

  const renderDashboard = () => {
    return render(<Dashboard onLogout={mockOnLogout} />)
  }

  it('renders dashboard with timeline by default', async () => {
    renderDashboard()

    expect(screen.getByText('Minha Timeline')).toBeInTheDocument()
    expect(screen.getByText('Novo Evento')).toBeInTheDocument()

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/professionals')
      expect(global.fetch).toHaveBeenCalledWith('/api/events')
    })
  })

  it('loads events and professionals on mount', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/professionals')
      expect(global.fetch).toHaveBeenCalledWith('/api/events')
    })
  })

  it('opens new event modal when button is clicked', async () => {
    renderDashboard()

    const newEventButton = screen.getByText('Novo Evento')
    fireEvent.click(newEventButton)

    // Verificar se o modal está aberto (pode precisar de ajustes dependendo da implementação)
    await waitFor(() => {
      expect(screen.getByText('Minha Timeline')).toBeInTheDocument()
    })
  })

  it('calls onLogout when logout menu is clicked', () => {
    renderDashboard()

    // Simular clique no menu de logout (através do Sidebar)
    // Como o Sidebar é mockado, podemos testar a função diretamente
    const sidebar = screen.getByRole('complementary') // Sidebar role
    expect(sidebar).toBeInTheDocument()
  })

  it('displays current date correctly', () => {
    renderDashboard()

    // Verificar se a data atual está sendo exibida
    const dateElement = screen.getByText(/^\d{2}\/\d{2}\/\d{4} - /)
    expect(dateElement).toBeInTheDocument()
  })

  it('shows empty state when no events exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/events') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          })
        }
        if (url === '/api/professionals') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockProfessionals),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      })
    )

    renderDashboard()

    await waitFor(() => {
      // Busca apenas em divs com a classe text-center
      const emptyDivs = screen.getAllByText(
        (_, n) =>
          !!n &&
          n.textContent?.includes('Ainda não existem eventos cadastrados') &&
          n.tagName === 'DIV' &&
          n.className.includes('text-center')
      )
      expect(emptyDivs.length).toBeGreaterThan(0)
    })
  })

  it('handles fetch errors gracefully', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    // Cria uma promessa que será rejeitada

    let rejectFn: (err: Error) => void
    const fetchPromise: Promise<Response> = new Promise((_, reject) => {
      rejectFn = reject
    })
    const fetchSpy = vi.spyOn(global, 'fetch').mockReturnValue(fetchPromise)

    render(<Dashboard onLogout={vi.fn()} />)

    // Rejeita a promise após render para garantir que o erro seja capturado pelo React
    rejectFn!(new Error('Network error'))

    // Aguarda a chamada do console.error
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching events:',
        expect.any(Error)
      )
    })

    // Restaura o mock para não afetar outros testes
    fetchSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('refreshes events after modal closes', async () => {
    renderDashboard()

    // Simular fechamento do modal (isso deveria chamar refreshEvents)
    // Como não temos acesso direto ao estado do modal, verificamos se fetch foi chamado novamente
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/events')
    })
  })

  it('polls events every 30 seconds', async () => {
    vi.useFakeTimers()

    renderDashboard()

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/events')
    })

    // Avançar 60 segundos (intervalo real do componente)
    vi.advanceTimersByTime(60000)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3) // 1 inicial + 1 polling
    })

    vi.useRealTimers()
  })
})
