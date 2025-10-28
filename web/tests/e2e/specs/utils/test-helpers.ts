import { Page, expect } from '@playwright/test'

export async function login(page: Page) {
  await page.goto('/')
  // Preenche as credenciais na tela de login
  await page.getByPlaceholder('usuário@email.com').fill('test@example.com')
  await page.getByPlaceholder('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  // Espera o dashboard aparecer (sidebar com texto OmniSaúde)
  await expect(page.getByText('OmniSaúde')).toBeVisible()
}

export async function logout(page: Page) {
  // Clica no botão 'Sair' no sidebar
  await page.getByRole('button', { name: 'Sair' }).click()
  // Espera voltar para tela de login
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
}

export async function cleanupDatabase() {
  // Aqui você pode adicionar lógica para limpar o banco de dados entre os testes
  // usando o cliente Prisma ou chamadas de API específicas
}