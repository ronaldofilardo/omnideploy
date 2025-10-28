import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
// Removido import duplicado de jest-dom - já é configurado em setupJestDom.ts

// Mock global para scrollIntoView (Radix UI Select)
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

// Suprimir warnings do Radix UI (Dialog/Select) para não poluir o output dos testes
const originalConsoleError = console.error;
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    const msg = args[0];
    if (
      typeof msg === 'string' &&
      (msg.includes('DialogContent') || msg.includes('aria-describedby') || msg.includes('DialogTitle'))
    ) {
      return;
    }
    originalConsoleError(...args);
  });
});

afterAll(() => {
  (console.error as any).mockRestore?.();
});

afterEach(() => {
  cleanup();
});
