import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do fs/promises
vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}))

// Mock do path
vi.mock('path', () => ({
  join: vi.fn(),
}))

// Mock do crypto
vi.mock('crypto', () => ({
  randomUUID: vi.fn(),
}))

// Importar a rota depois dos mocks
import { POST } from '../upload/route'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// Criar referências tipadas para os mocks
const mockWriteFile = writeFile as any
const mockMkdir = mkdir as any
const mockJoin = join as any
const mockRandomUUID = randomUUID as any

describe('/api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Configurar mocks padrão
    mockJoin.mockReturnValue('/uploads/test-file.jpg')
    mockRandomUUID.mockReturnValue('test-uuid')
  })

  describe('POST', () => {
    it('should upload file successfully', async () => {
      const mockFile = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as unknown as Request

      mockWriteFile.mockResolvedValue(undefined)
      mockMkdir.mockResolvedValue(undefined)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        url: '/uploads/test-uuid.jpg',
        name: 'test.jpg',
      })
      expect(mockMkdir).toHaveBeenCalledWith('/uploads', { recursive: true })
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/uploads/test-file.jpg',
        expect.any(Buffer)
      )
    })

    it('should return 400 when no file is provided', async () => {
      const mockFormData = new FormData()
      // No file appended

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Nenhum arquivo enviado')
    })

    it('should handle file upload errors', async () => {
      const mockFile = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as unknown as Request

      mockWriteFile.mockRejectedValue(new Error('Write error'))

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno do servidor')
    })

    it('should handle directory creation errors', async () => {
      const mockFile = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as unknown as Request

      mockMkdir.mockRejectedValue(new Error('Mkdir error'))

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno do servidor')
    })

    it('should handle formData parsing errors', async () => {
      const mockRequest = {
        formData: vi.fn().mockRejectedValue(new Error('FormData error')),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno do servidor')
    })

    it('should handle files with different extensions', async () => {
      const mockFile = new File(['test content'], 'document.pdf', {
        type: 'application/pdf',
      })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as unknown as Request

      mockJoin.mockReturnValue('/uploads/test-uuid.pdf')
      mockWriteFile.mockResolvedValue(undefined)
      mockMkdir.mockResolvedValue(undefined)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.url).toBe('/uploads/test-uuid.pdf')
      expect(data.name).toBe('document.pdf')
    })

    it('should handle files without extension', async () => {
      const mockFile = new File(['test content'], 'filewithoutextension', {
        type: 'text/plain',
      })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as unknown as Request

      mockJoin.mockReturnValue('/uploads/test-uuid.')
      mockWriteFile.mockResolvedValue(undefined)
      mockMkdir.mockResolvedValue(undefined)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.url).toBe('/uploads/test-uuid.')
      expect(data.name).toBe('filewithoutextension')
    })

    it('should convert file to buffer correctly', async () => {
      const testContent = 'test file content'
      const mockFile = new File([testContent], 'test.txt', {
        type: 'text/plain',
      })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as unknown as Request

      mockWriteFile.mockResolvedValue(undefined)
      mockMkdir.mockResolvedValue(undefined)

      await POST(mockRequest)

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/uploads/test-file.txt',
        Buffer.from(await mockFile.arrayBuffer())
      )
    })

    it('should create uploads directory with recursive option', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as unknown as Request

      mockWriteFile.mockResolvedValue(undefined)
      mockMkdir.mockResolvedValue(undefined)

      await POST(mockRequest)

      expect(mockMkdir).toHaveBeenCalledWith('/uploads', { recursive: true })
    })
  })
})
