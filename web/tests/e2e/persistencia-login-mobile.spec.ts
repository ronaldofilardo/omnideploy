import { test, expect, devices } from '@playwright/test'

test.use({ ...devices['iPhone 8'] })

test.describe('Persistência de login no mobile', () => {
  test('usuário permanece logado após reload no mobile', async ({ page }) => {
    await page.goto('http://localhost:3000/')

    // Login manual (ajuste os seletores conforme necessário)
    await page.fill('input[placeholder="usuário@email.com"]', 'test@example.com')
    await page.fill('input[placeholder="Senha"]', 'senha123')
    await page.click('button:has-text("Entrar")')

    // Espera dashboard aparecer
    await expect(page.locator('text=Timeline')).toBeVisible()

    // Reload
    await page.reload()

    // Deve continuar logado
    await expect(page.locator('text=Timeline')).toBeVisible()
  })
})
