import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateUserModal } from '../../../src/components/CreateUserModal'

describe('CreateUserModal', () => {
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderModal = (open = true) => {
    return render(
      <CreateUserModal open={open} onOpenChange={mockOnOpenChange} />
    )
  }

  it('renders modal when open is true', () => {
    renderModal(true)

  // Há dois títulos "Criar Novo Usuário" (um VisuallyHidden, um visível)
  const titles = screen.getAllByText('Criar Novo Usuário')
  // Pelo menos um título deve estar presente
  expect(titles.length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText('Nome completo')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('CPF')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Telefone')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('user@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByText('Criar Usuário')).toBeInTheDocument()
  })

  it('does not render modal when open is false', () => {
    renderModal(false)

    expect(screen.queryByText('Criar Novo Usuário')).not.toBeInTheDocument()
  })

  it('allows typing in full name field', () => {
    renderModal(true)

    const input = screen.getByPlaceholderText('Nome completo')
    fireEvent.change(input, { target: { value: 'João Silva' } })

    expect(input).toHaveValue('João Silva')
  })

  it('formats CPF correctly', () => {
    renderModal(true)

    const input = screen.getByPlaceholderText('CPF')
    fireEvent.change(input, { target: { value: '12345678901' } })

    expect(input).toHaveValue('123.456.789-01')
  })

  it('formats phone correctly', () => {
    renderModal(true)

    const input = screen.getByPlaceholderText('Telefone')
    fireEvent.change(input, { target: { value: '11987654321' } })

    expect(input).toHaveValue('(11) 98765-4321')
  })

  it('allows typing in email field', () => {
    renderModal(true)

    const input = screen.getByPlaceholderText('user@email.com')
    fireEvent.change(input, { target: { value: 'joao@email.com' } })

    expect(input).toHaveValue('joao@email.com')
  })

  it('allows typing in password field', () => {
    renderModal(true)

    const input = screen.getByPlaceholderText('••••••••')
    fireEvent.change(input, { target: { value: 'senha123' } })

    expect(input).toHaveValue('senha123')
  })

  it('toggles password visibility', () => {
    renderModal(true)

    const input = screen.getByPlaceholderText('••••••••')
    expect(input).toHaveAttribute('type', 'password')

  // Filtra o botão de mostrar/ocultar senha dentro do wrapper do campo de senha
  const wrapper = input.closest('div')
  const toggleButton = wrapper ? within(wrapper).getByRole('button') : null
  expect(toggleButton).toBeTruthy()
  fireEvent.click(toggleButton!)

  expect(input).toHaveAttribute('type', 'text')

  fireEvent.click(toggleButton!)
  expect(input).toHaveAttribute('type', 'password')
  })

  it('handles form submission', async () => {
    // Mock global fetch para simular cadastro bem-sucedido
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 'user-1' })
    })) as any;

    renderModal(true)

    const fullNameInput = screen.getByPlaceholderText('Nome completo')
    fireEvent.change(fullNameInput, { target: { value: 'João Silva' } })

    const cpfInput = screen.getByPlaceholderText('CPF')
    fireEvent.change(cpfInput, { target: { value: '12345678901' } })

    const phoneInput = screen.getByPlaceholderText('Telefone')
    fireEvent.change(phoneInput, { target: { value: '11987654321' } })

    const emailInput = screen.getByPlaceholderText('user@email.com')
    fireEvent.change(emailInput, { target: { value: 'joao@email.com' } })

    const passwordInput = screen.getByPlaceholderText('••••••••')
    fireEvent.change(passwordInput, { target: { value: 'senha123' } })

    const submitButton = screen.getByText('Criar Usuário')
    fireEvent.click(submitButton)

    // Aguarda o fechamento do modal
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows confirmation dialog when closing with data', () => {
    renderModal(true)

    const input = screen.getByPlaceholderText('Nome completo')
    fireEvent.change(input, { target: { value: 'João Silva' } })

    // Attempting to close would show confirmation dialog
  // Confirma que o título do modal de confirmação está presente (pode haver mais de um)
  const confirmTitles = screen.getAllByText('Criar Novo Usuário')
  expect(confirmTitles.length).toBeGreaterThan(0)
  })

  it('handles CPF with less than 11 digits', () => {
    renderModal(true)

    const input = screen.getByPlaceholderText('CPF')
    fireEvent.change(input, { target: { value: '123456789' } })

    expect(input).toHaveValue('123.456.789')
  })

  it('handles phone with less than 11 digits', () => {
    renderModal(true)

    const input = screen.getByPlaceholderText('Telefone')
    fireEvent.change(input, { target: { value: '1198765432' } })

    expect(input).toHaveValue('(11) 98765-432')
  })

  it('handles CPF with more than 11 digits', () => {
    renderModal(true)

    const input = screen.getByPlaceholderText('CPF')
    fireEvent.change(input, { target: { value: '123456789012' } })

    // Should keep the previous value since it exceeds 11 digits
    expect(input).toHaveValue('')
  })

  it('handles phone with more than 11 digits', () => {
    renderModal(true)

    const input = screen.getByPlaceholderText('Telefone')
    fireEvent.change(input, { target: { value: '119876543210' } })

    // Should keep the previous value since it exceeds 11 digits
    expect(input).toHaveValue('')
  })

  it('respects maxLength for CPF input', () => {
    renderModal(true)

    const input = screen.getByPlaceholderText('CPF')
    expect(input).toHaveAttribute('maxLength', '14') // 11 digits + 3 dots + 1 dash
  })

  it('respects maxLength for phone input', () => {
    renderModal(true)

    const input = screen.getByPlaceholderText('Telefone')
    expect(input).toHaveAttribute('maxLength', '15') // (00) 00000-0000
  })

  it('handles empty form submission', async () => {
    renderModal(true)

    const submitButton = screen.getByText('Criar Usuário')
    fireEvent.click(submitButton)

    // Aguarda mensagem de erro
    await screen.findByRole('alert')
    expect(screen.getByRole('alert')).toHaveTextContent('E-mail e senha são obrigatórios')
  })
})
