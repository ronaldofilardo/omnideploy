# HISTÓRICO DE ALTERAÇÕES RECENTES

## 27/10/2025

### AssociateNotificationModal.tsx

- Hooks (useState, useEffect) movidos para dentro do componente para corrigir erro "Invalid hook call" do React.
- Lógica de busca de profissionais adicionada dentro do componente.
- Opções do select agora exibem: "TIPO - Profissional - dd/mm/aaaa - hh:mm".
- Garantido que o arquivo da notificação é adicionado ao array de arquivos do evento ao associar.
- Ajustes para evitar erros de tipagem implícita do TypeScript (pendente refino).

### NotificationCenter.tsx

- Modal de associação agora recebe o objeto completo da notificação.
- Ajuste para garantir passagem correta de dados para os modais.

### ExternalLabSubmit.tsx

- Melhorias na experiência de upload de arquivos.
- Correção no controle de estado do arquivo selecionado.

### Observações Gerais

- Correções de erros de React relacionados a hooks.
- Melhorias de UX em modais e formulários.
- Pendência: refino de tipagem TypeScript em funções de array.

---

Este histórico foi atualizado automaticamente para refletir as últimas alterações realizadas via chat.
