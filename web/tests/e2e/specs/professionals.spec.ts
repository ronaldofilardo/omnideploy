import { test, expect } from '@playwright/test'
import { login, logout, cleanupDatabase } from './utils/test-helpers'

test.describe('Fluxo de Profissionais', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test.beforeAll(async () => {
    await cleanupDatabase()
  })

  test('deve criar, editar e excluir um profissional', async ({ page }) => {
    // Navega para a aba de profissionais
    await page.locator('[data-testid="sidebar"]').getByRole('button', { name: 'Profissionais' }).click()

    // Adiciona um novo profissional
    await page.locator('[data-testid="professionals-tab"]').getByRole('button', { name: 'Adicionar Profissional' }).click()

    // Preenche os dados do profissional
    await page.getByLabel('Nome').fill('Dr. Teste')
    await page.getByLabel('Especialidade').click()
    await page.getByRole('option', { name: 'Psicologia' }).click()
    await page.getByLabel('Contato').fill('dr.teste@example.com')

    // Salva o profissional
    await page.getByRole('button', { name: 'Salvar' }).click()

    // Verifica se o profissional foi criado
    await expect(page.getByText('Dr. Teste')).toBeVisible()
    await expect(page.getByText('Psicologia')).toBeVisible()

    // Edita o profissional
    await page.getByText('Dr. Teste').click()
    await page.getByRole('button', { name: 'Editar' }).click()

    // Atualiza os dados
    await page.getByLabel('Nome').fill('Dr. Teste Atualizado')
    await page.getByRole('button', { name: 'Salvar' }).click()

    // Verifica se foi atualizado
    await expect(page.getByText('Dr. Teste Atualizado')).toBeVisible()

    // Exclui o profissional
    await page.getByText('Dr. Teste Atualizado').click()
    await page.getByRole('button', { name: 'Excluir' }).click()
    await page.getByRole('button', { name: /Sair sem salvar|Confirmar/i }).click()

    // Verifica se foi excluído
    await expect(page.getByText('Dr. Teste Atualizado')).not.toBeVisible()
  })

  test('deve validar campos obrigatórios ao criar profissional', async ({ page }) => {
    await page.locator('[data-testid="sidebar"]').getByRole('button', { name: 'Profissionais' }).click()
    await page.locator('[data-testid="professionals-tab"]').getByRole('button', { name: 'Adicionar Profissional' }).click()

    // Tenta salvar sem preencher os campos
    await page.locator('[data-testid="add-professional-modal"]').getByRole('button', { name: 'Salvar' }).click()

    // Verifica as mensagens de erro (ajustar conforme implementação real)
    await expect(page.getByText('Por favor, preencha o nome do profissional.')).toBeVisible()
    await expect(page.getByText('Por favor, selecione uma especialidade.')).toBeVisible()
  })
})