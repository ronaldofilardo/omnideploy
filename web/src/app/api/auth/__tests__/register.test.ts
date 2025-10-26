import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}))

// Mock do lib/prisma.ts antes de importar a rota
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// Importar a rota e o prisma mockado depois do mock
import { POST } from '../register/route'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Criar referência tipada para o mock
const mockPrisma = prisma as any
const mockBcrypt = bcrypt as any

describe('/api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST', () => {
    it('should register successfully with valid data', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue(mockUser)
      mockBcrypt.hash.mockResolvedValue('hashed-password')

      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      })
      expect(data.user).not.toHaveProperty('password')
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed-password',
          name: 'Test User',
        },
      })
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

    it('should return 400 for existing user', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Existing User',
      }

      mockPrisma.user.findUnique.mockResolvedValue(existingUser)

      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Usuário já existe')
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('should return 500 on database error during findUnique', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
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
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockRejectedValue(new Error('Bcrypt error'))

      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno do servidor')
    })

    it('should return 500 on database error during create', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue('hashed-password')
      mockPrisma.user.create.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno do servidor')
    })

    it('should handle optional name field', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: null,
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue(mockUser)
      mockBcrypt.hash.mockResolvedValue('hashed-password')

      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
        // name is optional
      }

      const mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.user.name).toBeNull()
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed-password',
          name: undefined,
        },
      })
    })
  })
})
