import * as React from 'react'

interface TestWrapperProps {
  children: React.ReactNode
}

/**
 * TestWrapper que envolve componentes com todos os providers necessários para testes
 * Atualmente, o Dashboard não usa providers complexos (Auth, Theme, QueryClient),
 * então este wrapper serve como base para futuras extensões.
 */
export function TestWrapper({ children }: TestWrapperProps) {
  return <>{children}</>
}

/**
 * Hook para criar um wrapper de teste customizado
 */
export function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <TestWrapper>{children}</TestWrapper>
  }
}
