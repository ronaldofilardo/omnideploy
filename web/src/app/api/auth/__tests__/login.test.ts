import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}))

// Mock do lib/prisma.ts antes de importar a rota
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

// Importar a rota e o prisma mockado depois do mock
import { POST } from '../login/route'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Criar referência tipada para o mock
const mockPrisma = prisma as any
const mockBcrypt = bcrypt as any

describe('/api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(true)

      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      })
      expect(data.user).not.toHaveProperty('password')
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password'
      )
    })

    it('should return 400 for missing email or password', async () => {
      const requestBody = {
        email: 'test@example.com',
        // missing password
      }

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email e senha são obrigatórios')
    })

    it('should return 401 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const requestBody = {
        email: 'nonexistent@example.com',
        password: 'password123',
      }

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Credenciais inválidas')
    })

    it('should return 401 for invalid password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(false)

      const requestBody = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Credenciais inválidas')
    })

    it('should return 500 on database error', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno do servidor')
    })

    it('should return 500 on bcrypt error', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt error'))

      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno do servidor')
    })
  })
})
