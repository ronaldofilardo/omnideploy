import { render, screen, fireEvent } from '@testing-library/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select'
import React from 'react'
import { describe, it, expect } from 'vitest'

describe('Select (UI)', () => {
  it('renderiza opções e permite seleção', async () => {
    render(
      <Select defaultOpen>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent data-testid="dropdown">
          <SelectItem value="1">Opção 1</SelectItem>
          <SelectItem value="2">Opção 2</SelectItem>
        </SelectContent>
      </Select>
    )
    // O placeholder deve aparecer
    expect(screen.getByText(/Selecione/)).toBeInTheDocument()
  // Dropdown já aberto via `defaultOpen` para evitar problemas com portal
  // Busca opções por data-slot (Radix pode renderizar em portal)
  const allOptions = Array.from(document.body.querySelectorAll('[data-slot="select-item"]'));
  const option1 = allOptions.find(el => el.textContent?.includes('Opção 1'));
  const option2 = allOptions.find(el => el.textContent?.includes('Opção 2'));
  expect(option1).toBeInTheDocument();
  expect(option2).toBeInTheDocument();
  // Seleciona uma opção
  fireEvent.click(option2!);
  // O valor selecionado deve aparecer
  expect(screen.getByText(/Opção 2/)).toBeInTheDocument();
  })

  it('tem contraste e classes visuais aplicadas', async () => {
    render(
      <Select defaultOpen>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Opção 1</SelectItem>
        </SelectContent>
      </Select>
    )
    // Dropdown já aberto via `defaultOpen` para evitar problemas com portal
    const dropdown = document.body.querySelector('[data-slot="select-content"]')
    expect(dropdown).toHaveClass('bg-white')
    expect(dropdown).toHaveClass('text-gray-900')
    expect(dropdown).toHaveClass('border-gray-400')
    // Garante que a opção está visível
    const allOptions = Array.from(document.body.querySelectorAll('[data-slot="select-item"]'));
    const option1 = allOptions.find(el => el.textContent?.includes('Opção 1'));
    expect(option1).toBeInTheDocument();
  })
})
