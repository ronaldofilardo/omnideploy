import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RepositoryTab } from '../../../src/components/RepositoryTab'

describe('RepositoryTab', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Consulta Cardiologia',
      date: '2024-10-25T10:00:00Z',
      startTime: '10:00',
      endTime: '11:00',
      files: [
        {
          slot: 'request',
          name: 'requisicao.pdf',
          url: 'http://example.com/requisicao.pdf',
        },
        {
          slot: 'result',
          name: 'laudo.pdf',
          url: 'http://example.com/laudo.pdf',
        },
      ],
      professional: {
        id: '1',
        name: 'Dr. João Silva',
        specialty: 'Cardiologia',
      },
    },
    {
      id: '2',
      title: 'Exame Dermatologia',
      date: '2024-10-25T14:00:00Z',
      startTime: '14:00',
      endTime: '15:00',
      files: [
        {
          slot: 'certificate',
          name: 'atestado.pdf',
          url: 'http://example.com/atestado.pdf',
        },
      ],
      professional: {
        id: '2',
        name: 'Dra. Maria Santos',
        specialty: 'Dermatologia',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    global.alert = vi.fn()
  })

  it('renders repository tab with title and current date', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })

    await act(async () => {
      render(<RepositoryTab />)
    })

    expect(screen.getByText('Repositório de Arquivos')).toBeInTheDocument()
    // Date will be current date, so we just check it exists
    expect(screen.getByText(/^\d{2}\/\d{2}\/\d{4} - /)).toBeInTheDocument()
  })

  it('shows loading state initially', async () => {
    ;(global.fetch as any).mockImplementationOnce(() => new Promise(() => {}))

    await act(async () => {
      render(<RepositoryTab />)
    })

    expect(screen.getByText('Carregando repositório...')).toBeInTheDocument()
  })

  it('renders events with files', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEvents),
    })

    await act(async () => {
      render(<RepositoryTab />)
    })

    await waitFor(() => {
      // Busca todos os h3 e verifica o texto completo
      const headings = screen.getAllByRole('heading', { level: 3 })
      expect(
        headings.some(h => h.textContent?.includes('Consulta Cardiologia - Dr. João Silva - 10:00 - 11:00'))
      ).toBe(true)
      expect(
        headings.some(h => h.textContent?.includes('Exame Dermatologia - Dra. Maria Santos - 14:00 - 15:00'))
      ).toBe(true)
    })
  })

  it('displays file summary correctly', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEvents),
    })

    await act(async () => {
      render(<RepositoryTab />)
    })

    await waitFor(() => {
      expect(screen.getByText(/Total: 3 documento\(s\)/)).toBeInTheDocument()
    })
  })

  it('filters events by search term', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEvents),
    })

    await act(async () => {
      render(<RepositoryTab />)
    })

    await waitFor(() => {
      const els = screen.getAllByText((_, el) => !!el && el.textContent?.includes('Consulta Cardiologia'))
      expect(els.length).toBeGreaterThan(0)
    })

    const searchInput = screen.getByPlaceholderText(
      'Buscar por evento, profissional ou arquivo...'
    )
    fireEvent.change(searchInput, { target: { value: 'Cardiologia' } })

    await waitFor(() => {
      const filteredEls = screen.getAllByText((_, el) => !!el && el.textContent?.includes('Consulta Cardiologia'))
      expect(filteredEls.length).toBeGreaterThan(0)
      expect(screen.queryByText('Exame Dermatologia')).not.toBeInTheDocument()
    })
  })

  it('shows no results message when search has no matches', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEvents),
    })

    await act(async () => {
      render(<RepositoryTab />)
    })

    await waitFor(() => {
      const els = screen.getAllByText((_, el) => !!el && el.textContent?.includes('Consulta Cardiologia'))
      expect(els.length).toBeGreaterThan(0)
    })

    const searchInput = screen.getByPlaceholderText(
      'Buscar por evento, profissional ou arquivo...'
    )
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    await waitFor(() => {
      const noResultEls = screen.getAllByText((_, el) => !!el && el.textContent?.includes('Nenhum resultado encontrado para sua busca.'))
      expect(noResultEls.length).toBeGreaterThan(0)
    })
  })

  it('shows empty state when no events', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })

    await act(async () => {
      render(<RepositoryTab />)
    })

    await waitFor(() => {
      const emptyEls = screen.getAllByText((_, el) => !!el && el.textContent?.includes('Nenhum arquivo encontrado no seu repositório.'))
      expect(emptyEls.length).toBeGreaterThan(0)
    })
  })

  it('groups events by date', async () => {
    const eventsSameDate = [
      ...mockEvents,
      {
        ...mockEvents[0],
        id: '3',
        title: 'Consulta Seguimento',
        startTime: '11:00',
        endTime: '12:00',
      },
    ]

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(eventsSameDate),
    })

    await act(async () => {
      render(<RepositoryTab />)
    })

    await waitFor(() => {
      // Deve haver pelo menos um header de data com o texto esperado
      const dateHeaders = screen.getAllByText((content, el) =>
        !!el && /^25\/10\/2024 - /.test(el.textContent || '')
      )
      expect(dateHeaders.length).toBeGreaterThan(0)
      // Todos os headers encontrados devem ter o mesmo texto
      dateHeaders.forEach(header => {
        expect(header.textContent).toContain('25/10/2024 - sexta-feira')
      })
    })
  })

  it('renders file slots correctly', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockEvents[0]]),
    })

    await act(async () => {
      render(<RepositoryTab />)
    })

    await waitFor(() => {
      // Verifica slot Solicitação
      const reqLabel = screen.getByText('Solicitação')
      expect(reqLabel.closest('div')?.textContent).toContain('Solicitação')
      expect(reqLabel.closest('div')?.textContent).toContain('requisicao.pdf')

      // Verifica slot Laudo/Resultado
      const laudoLabel = screen.getByText('Laudo/Resultado')
      expect(laudoLabel.closest('div')?.textContent).toContain('Laudo/Resultado')
      expect(laudoLabel.closest('div')?.textContent).toContain('laudo.pdf')

      // Verifica slot vazio Autorização
      const autoLabel = screen.getByText('Autorização')
      expect(autoLabel.closest('div')?.textContent).toContain('Autorização')
    })
  })

  it('handles view file action', async () => {
    global.open = vi.fn()
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockEvents[0]]),
    })

    await act(async () => {
      render(<RepositoryTab />)
    })

    await waitFor(() => {
      const viewButtons = screen.getAllByTitle('Visualizar')
      fireEvent.click(viewButtons[0])

      expect(global.open).toHaveBeenCalledWith(
        'http://example.com/requisicao.pdf',
        '_blank'
      )
    })
  })

  it('handles delete file action', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockEvents[0]]),
    })

    render(<RepositoryTab />)

    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('Deletar')
      fireEvent.click(deleteButtons[0])

      expect(global.alert).toHaveBeenCalledWith(
        "Funcionalidade de deletar o arquivo 'requisicao.pdf' a ser implementada."
      )
    })
  })

  it('handles upload file action', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockEvents[0]]),
    })

    render(<RepositoryTab />)

    await waitFor(() => {
      const uploadButtons = screen.getAllByTitle('Upload')
      fireEvent.click(uploadButtons[0])

      expect(global.alert).toHaveBeenCalledWith(
        "Funcionalidade de upload para o slot 'Autorização' a ser implementada."
      )
    })
  })

  it('handles API error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
      text: async () => 'API Error',
    })

    render(<RepositoryTab />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erro ao carregar repositório:',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })
})
