import { describe, it, expect, vi, beforeEach } from 'vitest'

// Garantir ambiente de teste
process.env.NODE_ENV = 'test'

// Mock mínimo de fs/promises com default para ES module
vi.mock('fs/promises', () => {
  const mock = {
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  };
  return { ...mock, default: mock };
});

// Mock mínimo de path com default para ES module
vi.mock('path', () => {
  const mock: any = {
    join: vi.fn((...args: any[]) => {
      // join(process.cwd(), 'public', 'uploads')
      if (args.length === 3 && args[1] === 'public' && args[2] === 'uploads') {
        return '/uploads';
      }
      // join('/uploads', 'test-uuid.jpg')
      if (args.length === 2 && args[0] === '/uploads' && args[1] === 'test-uuid.jpg') {
        return '/uploads/test-uuid.jpg';
      }
      // fallback padrão
      return args.join('/');
    })
  };
  mock.default = mock;
  return mock;
});

// Mock mínimo de crypto com default para ES module
vi.mock('crypto', () => {
  const mock = {
    randomUUID: vi.fn(() => 'test-uuid'),
  };
  return { ...mock, default: mock };
});


// Importar dependências DEPOIS dos mocks
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// Criar referências tipadas para os mocks
const mockWriteFile = writeFile as any
const mockMkdir = mkdir as any
const mockJoin = join as any
const mockRandomUUID = randomUUID as any

// Função utilitária para criar um mock NextRequest mínimo
function createMockNextRequest(formData: FormData) {
  return {
    formData: vi.fn().mockResolvedValue(formData),
    cookies: {},
    nextUrl: {},
    page: {},
    ua: '',
  } as any;
}

describe('/api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRandomUUID.mockReturnValue('test-uuid')
  })

  describe('POST', () => {
    it('should upload file successfully', async () => {
      const { POST } = await import('../../../src/app/api/upload/route');
      const mockFile = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      })
      // Mock do método arrayBuffer
      mockFile.arrayBuffer = vi.fn().mockResolvedValue(new TextEncoder().encode('test content').buffer)

      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      const mockRequest = createMockNextRequest(mockFormData)

      mockWriteFile.mockResolvedValue(undefined)
      mockMkdir.mockResolvedValue(undefined)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        url: '/uploads/test-uuid.jpg',
        name: 'test.jpg',
        uploadDate: expect.any(String),
      })
      expect(mockMkdir).toHaveBeenCalledWith('/uploads', { recursive: true })
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/uploads/test-uuid.jpg',
        expect.any(Buffer)
      )
    })

    it('should return 400 when no file is provided', async () => {
      const { POST } = await import('../../../src/app/api/upload/route');
      const mockFormData = new FormData()
      // No file appended

      const mockRequest = createMockNextRequest(mockFormData)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Nenhum arquivo enviado')
    })

    it('should handle file upload errors', async () => {
      const { POST } = await import('../../../src/app/api/upload/route');
      const mockFile = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      const mockRequest = createMockNextRequest(mockFormData)

      mockWriteFile.mockRejectedValue(new Error('Write error'))

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno do servidor')
    })

    it('should return 400 for file too large', async () => {
      const { POST } = await import('../../../src/app/api/upload/route');
      const largeContent = new Array(3 * 1024).fill('a').join('')
      const mockFile = new File([largeContent], 'large.jpg', {
        type: 'image/jpeg',
      })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      const mockRequest = createMockNextRequest(mockFormData)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toMatch(/Arquivo deve ter no máximo/)
    })

    it('should return 500 for mkdir error', async () => {
      const { POST } = await import('../../../src/app/api/upload/route');
      const mockFile = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      const mockRequest = createMockNextRequest(mockFormData)

      mockMkdir.mockRejectedValue(new Error('Mkdir error'))

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno do servidor')
    })
  })
})
