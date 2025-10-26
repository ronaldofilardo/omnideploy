import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Sidebar } from '../Sidebar'

describe('Sidebar', () => {
  const mockOnMenuClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (activeMenu = 'timeline') => {
    return render(
      <Sidebar activeMenu={activeMenu} onMenuClick={mockOnMenuClick} />
    )
  }

  it('renders sidebar with title and subtitle', () => {
    renderComponent()

    expect(screen.getByText('OmniSaúde')).toBeInTheDocument()
    expect(screen.getByText('Tudo em suas mãos')).toBeInTheDocument()
  })

  it('renders all menu items', () => {
    renderComponent()

    expect(screen.getByText('Timeline')).toBeInTheDocument()
    expect(screen.getByText('Profissionais')).toBeInTheDocument()
    expect(screen.getByText('Repositório')).toBeInTheDocument()
    expect(screen.getByText('Calendário')).toBeInTheDocument()
    expect(screen.getByText('Sair')).toBeInTheDocument()
  })

  it('highlights active menu item', () => {
    renderComponent('professionals')

    const professionalsButton = screen.getByText('Profissionais')
    expect(professionalsButton.closest('button')).toHaveClass(
      'bg-[#10B981]',
      'text-white'
    )
  })

  it('calls onMenuClick when menu item is clicked', () => {
    renderComponent()

    const timelineButton = screen.getByText('Timeline')
    fireEvent.click(timelineButton)

    expect(mockOnMenuClick).toHaveBeenCalledWith('timeline')
  })

  it('calls onMenuClick with correct id for each menu item', () => {
    renderComponent()

    const professionalsButton = screen.getByText('Profissionais')
    fireEvent.click(professionalsButton)
    expect(mockOnMenuClick).toHaveBeenCalledWith('professionals')

    const repositorioButton = screen.getByText('Repositório')
    fireEvent.click(repositorioButton)
    expect(mockOnMenuClick).toHaveBeenCalledWith('repositorio')

    const calendarioButton = screen.getByText('Calendário')
    fireEvent.click(calendarioButton)
    expect(mockOnMenuClick).toHaveBeenCalledWith('calendario')
  })

  it('calls onMenuClick with logout when sair is clicked', () => {
    renderComponent()

    const sairButton = screen.getByText('Sair')
    fireEvent.click(sairButton)

    expect(mockOnMenuClick).toHaveBeenCalledWith('logout')
  })

  it('applies correct styling to inactive menu items', () => {
    renderComponent('timeline')

    const professionalsButton = screen
      .getByText('Profissionais')
      .closest('button')
    expect(professionalsButton).toHaveClass(
      'text-[#374151]',
      'hover:bg-gray-50'
    )
    expect(professionalsButton).not.toHaveClass('bg-[#10B981]')
  })

  it('applies correct styling to logout button', () => {
    renderComponent()

    const sairButton = screen.getByText('Sair').closest('button')
    expect(sairButton).toHaveClass('text-[#EF4444]', 'hover:bg-red-50')
  })

  it('renders icons for each menu item', () => {
    renderComponent()

    // Check that icons are rendered (they have specific classes from lucide-react)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5) // 4 menu items + logout

    // Each button should contain an icon (svg element)
    buttons.forEach((button) => {
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  it('has correct sidebar dimensions', () => {
  renderComponent()

  // A div mais externa do sidebar é o parentElement do header
  const headerDiv = screen.getByText('OmniSaúde').closest('div')
  const sidebar = headerDiv?.parentElement
  expect(sidebar).toHaveClass('w-[280px]', 'h-screen')
  })

  it('has correct layout structure', () => {
    renderComponent()

    const headerDiv = screen.getByText('OmniSaúde').closest('div')
    const sidebar = headerDiv?.parentElement
    expect(sidebar).toHaveClass(
      'bg-white',
      'border-r',
      'border-[#E5E7EB]',
      'flex',
      'flex-col'
    )
  })

  it('renders menu items in correct order', () => {
    renderComponent()

    const menuItems = screen.getAllByRole('button')
    expect(menuItems[0]).toHaveTextContent('Timeline')
    expect(menuItems[1]).toHaveTextContent('Profissionais')
    expect(menuItems[2]).toHaveTextContent('Repositório')
    expect(menuItems[3]).toHaveTextContent('Calendário')
    expect(menuItems[4]).toHaveTextContent('Sair')
  })

  it('handles different active menu states', () => {
    const { rerender } = renderComponent('timeline')

    expect(screen.getByText('Timeline').closest('button')).toHaveClass(
      'bg-[#10B981]'
    )

    rerender(<Sidebar activeMenu="repositorio" onMenuClick={mockOnMenuClick} />)

    expect(screen.getByText('Timeline').closest('button')).not.toHaveClass(
      'bg-[#10B981]'
    )
    expect(screen.getByText('Repositório').closest('button')).toHaveClass(
      'bg-[#10B981]'
    )
  })
})
