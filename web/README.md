# Cobertura de Testes

![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)

# Projeto web

## Limitações conhecidas dos testes unitários

Alguns testes unitários podem falhar em ambiente JSDOM devido a limitações técnicas, especialmente ao testar componentes que usam:

- **Radix UI (ex: Dialog, Select)**: Dependem de APIs do DOM reais e podem emitir warnings ou não renderizar corretamente em portais.
- **Portais React**: Modais e dropdowns podem ser renderizados fora do DOM principal, dificultando queries nos testes.
- **Mocks de fetch e ciclo de vida React**: O mock pode não ser chamado conforme esperado se o componente receber props que evitam o fetch.

Essas falhas não indicam bugs reais no componente em produção, apenas limitações do ambiente de teste. Os componentes funcionam corretamente na aplicação real.
