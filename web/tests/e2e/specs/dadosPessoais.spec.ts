import { test, expect } from '@playwright/test';

test.describe('Fluxo de Dados Pessoais', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Teste da Silva',
    cpf: '123.456.789-00',
    telefone: '(41) 99999-9999',
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('usuário@email.com').fill(testUser.email);
    await page.getByPlaceholder('Senha').fill(testUser.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
  });

  test('deve mostrar dados pessoais do usuário corretamente', async ({ page }) => {
    // Navega para a aba de dados pessoais
    await page.locator('[data-testid="sidebar"]').getByRole('button', { name: 'Dados Pessoais' }).click();

    // Verifica se os campos estão presentes
    await expect(page.getByText('Nome')).toBeVisible();
    await expect(page.getByText('CPF')).toBeVisible();
    await expect(page.getByText('Telefone')).toBeVisible();
    await expect(page.getByText('E-mail')).toBeVisible();

    // Verifica se os dados do usuário estão corretos
    await expect(page.getByText(testUser.name)).toBeVisible();
    await expect(page.getByText(testUser.cpf)).toBeVisible();
    await expect(page.getByText(testUser.telefone)).toBeVisible();
    await expect(page.getByText(testUser.email)).toBeVisible();
  });

  test('fluxo completo de criação de usuário e visualização de dados', async ({ page }) => {
    // Clica no botão de novo usuário
    await page.getByText('Novo Usuário').click();

    // Preenche o formulário
    await page.getByPlaceholder('Nome completo').fill(testUser.name);
    await page.getByPlaceholder('CPF').fill(testUser.cpf);
    await page.getByPlaceholder('Telefone').fill(testUser.telefone);
    await page.getByPlaceholder('user@email.com').fill(testUser.email);
    await page.getByPlaceholder('••••••••').fill(testUser.password);

    // Clica em criar usuário
    await page.getByText('Criar Usuário').click();

    // Espera o redirecionamento e verifica se está na página correta
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    // Navega para a aba de dados pessoais
    await page.locator('[data-testid="sidebar"]').getByRole('button', { name: 'Dados Pessoais' }).click();

    // Verifica se os dados inseridos estão sendo exibidos corretamente
    await expect(page.getByText(testUser.name)).toBeVisible();
    await expect(page.getByText(testUser.cpf)).toBeVisible();
    await expect(page.getByText(testUser.telefone)).toBeVisible();
    await expect(page.getByText(testUser.email)).toBeVisible();
  });
});