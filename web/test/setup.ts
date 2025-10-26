import { beforeAll } from 'vitest'

beforeAll(() => {
  // Verifica se estamos usando o banco de testes
  if (
    process.env.DATABASE_URL?.includes('omni_mvp') &&
    !process.env.DATABASE_URL?.includes('omni_mvp_test')
  ) {
    throw new Error(
      '\x1b[31m[ERRO DE SEGURANÇA]\x1b[0m Tentativa de executar testes no banco de produção!' +
        '\nCertifique-se de que DATABASE_URL está apontando para o banco de testes (omni_mvp_test).' +
        '\nUse o comando correto para testes: npm test'
    )
  }

  // Verifica se o ambiente é de teste
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      '\x1b[31m[ERRO DE AMBIENTE]\x1b[0m Os testes devem ser executados em ambiente de teste!' +
        '\nUse o comando correto para testes: npm test'
    )
  }
})
