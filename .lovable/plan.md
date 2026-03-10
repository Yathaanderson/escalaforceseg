

# Plano: Campos financeiros nos Postos + Aba Financeira

## Passo 1 — Migração do banco de dados

Adicionar duas colunas na tabela `postos`:

```sql
ALTER TABLE public.postos ADD COLUMN valor_mensal numeric DEFAULT 0;
ALTER TABLE public.postos ADD COLUMN dia_pagamento integer DEFAULT 1;
```

## Passo 2 — Atualizar AdminPosts.tsx

- Adicionar states `valorMensal` e `diaPagamento`
- Incluir dois campos no formulário: "Valor mensal (R$)" (type number) e "Dia de pagamento" (type number, 1-31)
- Incluir nas mutations de create/update
- Exibir valor e dia de pagamento nos cards dos postos (formatado como moeda BRL)
- Atualizar `resetForm` e `handleEdit`

## Passo 3 — Criar página AdminFinanceiro.tsx

Dashboard financeiro com:
- **Resumo geral**: Total de receita mensal (soma dos `valor_mensal` de todos os postos ativos), total de funcionários ativos, e cards com indicadores
- **Tabela de receitas**: Lista de postos com valor mensal e dia de pagamento
- **Tabela de pagamentos**: Lista de funcionários ativos com dados de pagamento (campo `dados_pagamento`)
- **Campo de custo por funcionário**: Como não existe salário no banco, exibir contagem de escalas por funcionário no mês atual como referência
- **Margem estimada**: Receita total - (informativo, sem campo de salário ainda)

Usará queries em `postos` e `profiles` para montar os dados.

## Passo 4 — Adicionar rota e navegação

- `src/App.tsx`: Adicionar rota `/admin/financeiro` com `AdminFinanceiro`
- `src/layouts/AdminLayout.tsx`: Adicionar item "Financeiro" no menu com ícone `DollarSign`

## Arquivos afetados
- **Migration SQL** (2 colunas novas em `postos`)
- `src/pages/admin/AdminPosts.tsx` (formulário + cards)
- `src/pages/admin/AdminFinanceiro.tsx` (nova página)
- `src/App.tsx` (rota)
- `src/layouts/AdminLayout.tsx` (menu)

