import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { mockPrisma } from './prisma-mock'

// Mock global fetch
global.fetch = vi.fn()

// Mock Next.js components/hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))