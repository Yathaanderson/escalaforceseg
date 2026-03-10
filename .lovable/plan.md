

# Plano: Adicionar campo de dados bancários/PIX ao cadastro de funcionários

## Resumo
Adicionar uma coluna `dados_pagamento` (texto) na tabela `profiles` para armazenar conta bancária ou chave PIX, e exibir/editar esse campo no formulário e tabela de funcionários.

## Passo 1 — Migração do banco de dados
Adicionar coluna `dados_pagamento` (text, nullable) à tabela `profiles`.

```sql
ALTER TABLE public.profiles ADD COLUMN dados_pagamento text;
```

## Passo 2 — Atualizar AdminEmployees.tsx
- Adicionar state `dadosPagamento`
- Incluir campo `<Input placeholder="Conta bancária ou Chave PIX" />` no formulário (criar e editar)
- Incluir `dados_pagamento` nas mutations de create e update
- Adicionar coluna "Pagamento" na tabela (hidden em telas pequenas)
- Incluir no `resetForm` e `handleEdit`

## Arquivos afetados
- **Migration SQL** (nova coluna)
- `src/pages/admin/AdminEmployees.tsx` (formulário + tabela)

