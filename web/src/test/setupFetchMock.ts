// src/test/setupFetchMock.ts
import { vi } from 'vitest'

beforeAll(() => {
  vi.stubGlobal('fetch', async (input, init) => {
    const url = typeof input === 'string' ? input : input.url
    const method = init?.method || 'GET'

    // Mock de respostas baseadas na rota
    if (url.includes('/api/events')) {
      if (method === 'GET' && url === '/api/events') {
        // Lista de eventos
        return new Response(JSON.stringify([
          { id: '1', title: 'Evento 1', date: '2023-10-01' },
          { id: '2', title: 'Evento 2', date: '2023-10-02' }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      } else if (method === 'GET' && url.match(/\/api\/events\/\d+/)) {
        // Evento específico
        const id = url.split('/').pop()
        return new Response(JSON.stringify({
          id,
          title: `Evento ${id}`,
          date: '2023-10-01',
          description: 'Descrição do evento'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      } else if (method === 'POST') {
        // Criar evento
        return new Response(JSON.stringify({ id: '3', message: 'Evento criado' }), { status: 201, headers: { 'Content-Type': 'application/json' } })
      } else if (method === 'PUT') {
        // Atualizar evento
        return new Response(JSON.stringify({ message: 'Evento atualizado' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      } else if (method === 'DELETE') {
        // Deletar evento
        return new Response(JSON.stringify({ message: 'Evento deletado' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    } else if (url.includes('/api/professionals')) {
      if (method === 'GET' && url === '/api/professionals') {
        // Lista de profissionais
        return new Response(JSON.stringify([
          { id: '1', name: 'Profissional 1', specialty: 'Especialidade 1' },
          { id: '2', name: 'Profissional 2', specialty: 'Especialidade 2' }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      } else if (method === 'GET' && url.includes('type=specialties')) {
        // Especialidades
        return new Response(JSON.stringify(['Especialidade 1', 'Especialidade 2']), { status: 200, headers: { 'Content-Type': 'application/json' } })
      } else if (method === 'GET' && url.match(/\/api\/professionals\/\d+/)) {
        // Profissional específico
        const id = url.split('/').pop()
        return new Response(JSON.stringify({
          id,
          name: `Profissional ${id}`,
          specialty: 'Especialidade 1'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      } else if (method === 'POST') {
        // Criar profissional
        return new Response(JSON.stringify({ id: '3', message: 'Profissional criado' }), { status: 201, headers: { 'Content-Type': 'application/json' } })
      } else if (method === 'PUT') {
        // Atualizar profissional
        return new Response(JSON.stringify({ message: 'Profissional atualizado' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      } else if (method === 'DELETE') {
        // Deletar profissional
        return new Response(JSON.stringify({ message: 'Profissional deletado' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    } else if (url.includes('/api/repository')) {
      // Repositório
      return new Response(JSON.stringify([
        { id: '1', name: 'Arquivo 1', type: 'pdf' },
        { id: '2', name: 'Arquivo 2', type: 'doc' }
      ]), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } else if (url.includes('/api/upload')) {
      // Upload
      return new Response(JSON.stringify({ message: 'Arquivo enviado', url: 'http://example.com/file.pdf' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } else if (url.includes('/api/graphql')) {
      // GraphQL
      return new Response(JSON.stringify({ data: { events: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } else if (url.includes('/api/auth/login')) {
      // Login
      return new Response(JSON.stringify({ token: 'fake-token', user: { id: '1', name: 'User' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } else if (url.includes('/api/auth/register')) {
      // Registro
      return new Response(JSON.stringify({ message: 'Usuário registrado', user: { id: '1', name: 'User' } }), { status: 201, headers: { 'Content-Type': 'application/json' } })
    }

    // Fallback para rotas não mapeadas
    return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
})
