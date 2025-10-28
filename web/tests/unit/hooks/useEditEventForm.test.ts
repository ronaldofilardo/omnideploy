import { renderHook, act } from '@testing-library/react'
import { useEditEventForm } from '../../../src/hooks/useEditEventForm'
import * as React from 'react'

const INITIAL_STATE = {
  eventType: '',
  selectedProfessional: '',
  date: '',
  startTime: '',
  endTime: '',
  observation: '',
  hasInstructions: false,
  instructions: '',
}

// Vitest globals
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('useEditEventForm', () => {
  const mockEvent = {
    id: '1',
    title: 'Consulta',
    description: 'Descrição',
    date: '2025-10-27',
    type: 'consulta',
    professionalId: 'p1',
    startTime: '09:00',
    endTime: '10:00',
    observation: 'Obs',
    instructions: false,
  }
  const professionals = [
    { id: 'p1', name: 'Dr. A', specialty: 'Cardio' },
    { id: 'p2', name: 'Dr. B', specialty: 'Clínico' },
  ]
  const onSave = vi.fn()
  const onClose = vi.fn()

  // CORREÇÃO APLICADA AQUI
  beforeEach(() => {
    // Limpa o histórico de chamadas e instâncias de todos os mocks
    vi.clearAllMocks()

    // Usa vi.spyOn para interceptar o fetch de forma segura
    vi.spyOn(global, 'fetch').mockImplementation((url: any, opts: any) => {
      // Helper para criar um Response mock
      function createResponse(data: any, ok = true, status = 200) {
        return Promise.resolve({
          ok,
          status,
          statusText: ok ? 'OK' : 'Error',
          headers: new Headers(),
          redirected: false,
          type: 'basic',
          url: typeof url === 'string' ? url : '',
          clone() { return this },
          body: null,
          bodyUsed: false,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          blob: () => Promise.resolve(new Blob()),
          formData: () => Promise.resolve(new FormData()),
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data)),
        } as Response)
      }
      // Lógica do mock para GET /api/events (evita loop)
      if (typeof url === 'string' && url.includes('/api/events') && (!opts || opts.method === 'GET')) {
        return createResponse([])
      }
      // Lógica para PUT
      if (opts && opts.method === 'PUT') {
        return createResponse({ ...mockEvent, ...JSON.parse(opts.body) })
      }
      // Fallback para outras chamadas
      return createResponse({})
    })
  })

  afterEach(() => {
    // vi.restoreAllMocks() restaura todos os spies criados com vi.spyOn
    // Isso garante que `global.fetch` volte ao seu estado original após cada teste.
    vi.restoreAllMocks()
  })

  // ... (seus testes 'it' continuam aqui, sem alterações)

  // ATENÇÃO: Para os testes específicos que precisam de um mock de fetch diferente,
  // faça o mock dentro do próprio teste. Ele será limpo pelo afterEach.
  it('deve validar sobreposição de eventos', async () => {
    // Mock específico para este teste
    // O spy criado no beforeEach será sobrescrito por este.
    vi.spyOn(global, 'fetch').mockImplementation((url: any) => {
      function createResponse(data: any, ok = true, status = 200) {
        return Promise.resolve({
          ok,
          status,
          statusText: ok ? 'OK' : 'Error',
          headers: new Headers(),
          redirected: false,
          type: 'basic',
          url: typeof url === 'string' ? url : '',
          clone() { return this },
          body: null,
          bodyUsed: false,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          blob: () => Promise.resolve(new Blob()),
          formData: () => Promise.resolve(new FormData()),
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data)),
        } as Response)
      }
      if (typeof url === 'string' && url.includes('/api/events')) {
        return createResponse([
          { ...mockEvent, id: '2', startTime: '09:30', endTime: '10:30', date: '2025-10-27' },
        ])
      }
      return createResponse({})
    })

    let result: any
    // ... resto do teste
  })

  it('deve lidar com erro de API ao submeter', async () => {
    // Mock específico para este teste
    vi.spyOn(global, 'fetch').mockImplementation((url: any, opts: any) => {
      function createResponse(data: any, ok = true, status = 200) {
        return Promise.resolve({
          ok,
          status,
          statusText: ok ? 'OK' : 'Error',
          headers: new Headers(),
          redirected: false,
          type: 'basic',
          url: typeof url === 'string' ? url : '',
          clone() { return this },
          body: null,
          bodyUsed: false,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          blob: () => Promise.resolve(new Blob()),
          formData: () => Promise.resolve(new FormData()),
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data)),
        } as Response)
      }
      if (opts && opts.method === 'PUT') {
        return createResponse({ error: 'Erro ao editar evento' }, false, 400)
      }
      return createResponse([])
    })

    let result: any
    // ... resto do teste
  })
})
