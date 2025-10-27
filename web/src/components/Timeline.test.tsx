import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Timeline } from '../components/Timeline'

describe('Timeline', () => {
  const mockProfessionals = [
    {
      id: 'prof1',
      name: 'Dr. Test',
      specialty: 'Especialidade Test',
      address: 'Endereço Test',
      contact: 'Contato Test'
    }
  ]

  it('deve renderizar a timeline vazia', () => {
    render(<Timeline events={[]} professionals={mockProfessionals} />)
    // Ajuste o texto de acordo com o que seu componente realmente exibe
    expect(screen.getByText(/Nenhum evento/i)).toBeInTheDocument()
  })

  it('deve renderizar eventos corretamente', () => {
    const mockEvents = [
      {
        id: '1',
        title: 'Consulta Test',
        date: '2025-10-26',
        startTime: '10:00',
        endTime: '11:00',
  type: 'CONSULTA',
        professionalId: 'prof1',
        files: []
      }
    ]

    render(<Timeline 
      events={mockEvents} 
      professionals={mockProfessionals}
      onView={() => {}}
      onFiles={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
      onUpdate={() => {}}
    />)
    expect(screen.getByText('Consulta Test')).toBeInTheDocument()
  })
})