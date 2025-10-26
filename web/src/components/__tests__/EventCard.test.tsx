import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EventCard } from '../EventCard'
import type { Event } from '../Timeline'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do Next.js Image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} {...props} />
  ),
}))

// Mock do navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
})

// Mock do window.open
global.open = vi.fn()

// Mock do fetch para upload
describe('EventCard', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/upload') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ url: 'mocked-url' }),
          })
        }
        if (url === '/api/events') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      })
    )
  })
  const event: Event = {
    id: '1',
    title: 'Consulta Médica',
    description: '',
    date: '2025-10-24',
    type: 'CONSULTATION',
    professionalId: 'prof-1',
    startTime: '10:00',
    endTime: '11:00',
    observation: 'Trazer exames anteriores',
    files: [],
  }
  const defaultProps = {
    event,
    professional: 'Dr. Silva',
    address: 'Rua das Flores, 123',
  }

  it('renders event information correctly', () => {
    render(<EventCard {...defaultProps} />)
    expect(screen.getByText('Consulta - Dr. Silva - 10:00 - 11:00')).to.exist
    expect(screen.getByText('Rua das Flores, 123')).to.exist
    expect(screen.getByText('Instruções: Trazer exames anteriores')).to.exist
  })

  it('opens view modal when details button is clicked', () => {
    render(<EventCard {...defaultProps} />)
    const detailsButton = screen.getByRole('button', { name: /detalhes/i })
    fireEvent.click(detailsButton)
    expect(screen.getByText('Consulta')).to.exist
    expect(screen.getByText('Dr. Silva')).to.exist
  })

  it('copies address to clipboard when copy button is clicked', () => {
    render(<EventCard {...defaultProps} />)
    const copyButton = screen.getByTitle('Copiar endereço')
    fireEvent.click(copyButton)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Rua das Flores, 123'
    )
  })

  it('opens delete modal when delete button is clicked', () => {
  render(<EventCard {...defaultProps} />)
  const deleteButton = screen.getByRole('button', { name: /deletar/i })
  fireEvent.click(deleteButton)
  expect(screen.getByText((_, n) => !!n && n.textContent?.includes('Confirmar Exclusão'))).to.exist
  })

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = vi.fn()
    render(<EventCard {...defaultProps} onEdit={mockOnEdit} />)
    const editButton = screen.getByRole('button', { name: /editar/i })
    fireEvent.click(editButton)
    expect(mockOnEdit).toHaveBeenCalled()
  })

  it('opens files modal when files button is clicked', () => {
    render(<EventCard {...defaultProps} />)
    const filesButton = screen.getByRole('button', { name: /arquivos/i })
    fireEvent.click(filesButton)
    expect(screen.getByText('Gerenciar Arquivos do Evento')).to.exist
  })

  it('displays file slots correctly', () => {
    render(<EventCard {...defaultProps} />)
    const filesButton = screen.getByRole('button', { name: /arquivos/i })
    fireEvent.click(filesButton)
    expect(screen.getByText('Solicitação')).to.exist
    expect(screen.getByText('Autorização')).to.exist
    expect(screen.getByText('Atestado')).to.exist
    expect(screen.getByText('Laudo/Resultado')).to.exist
    expect(screen.getByText('Prescrição')).to.exist
    expect(screen.getByText('Nota Fiscal')).to.exist
  })

  it('shows uploaded file status when initialFiles are provided', () => {
    const eventWithFiles: Event = {
      ...event,
      files: [
        { slot: 'request', name: 'Arquivo 1', url: 'url1' },
        { slot: 'authorization', name: '', url: '' },
        { slot: 'certificate', name: '', url: '' },
        { slot: 'result', name: '', url: '' },
        { slot: 'prescription', name: '', url: '' },
        { slot: 'invoice', name: '', url: '' },
      ],
    }
    render(<EventCard {...defaultProps} event={eventWithFiles} />)
    const filesButton = screen.getByRole('button', { name: /arquivos/i })
    fireEvent.click(filesButton)
    // Verificar se o primeiro slot mostra arquivo carregado
    expect(screen.getByText('Arquivo 1')).to.exist
  })

  it('uploads file when file is selected and conclude is clicked', async () => {
    render(<EventCard {...defaultProps} />)
    const filesButton = screen.getByRole('button', { name: /arquivos/i })
    fireEvent.click(filesButton)

    // Encontrar o input de file
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Clicar em Concluir
    const concludeButton = screen.getByRole('button', { name: /concluir/i })
    fireEvent.click(concludeButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/upload',
        expect.any(Object)
      )
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/events',
        expect.any(Object)
      )
    })
  })
})
