

# Plano: Campos financeiros nos funcionários + Margem real no dashboard

## Passo 1 — Migração do banco de dados

Adicionar 3 colunas na tabela `profiles`:

```sql
ALTER TABLE public.profiles ADD COLUMN valor_diaria numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN salario_mensal numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN valor_extra numeric DEFAULT 0;
```

## Passo 2 — Atualizar AdminEmployees.tsx

- Adicionar states: `valorDiaria`, `salarioMensal`, `valorExtra`
- Incluir 3 campos no formulário: "Valor da diária (R$)", "Salário mensal (R$)", "Valor extra (R$)" — todos type number
- Remover `required` do campo e-mail (torná-lo opcional)
- Incluir os novos campos nas mutations de create e update
- Atualizar `resetForm` e `handleEdit`
- Exibir "Diária" e "Salário" na tabela (colunas hidden em telas pequenas)

## Passo 3 — Atualizar AdminFinanceiro.tsx

- Calcular **custo total** = soma de `salario_mensal` + `valor_extra` de todos os funcionários ativos
- Adicionar card "Custo Mensal" e card "Margem" (receita - custo)
- Na tabela de funcionários, adicionar colunas: Diária, Salário, Extra
- Adicionar linha de total na tabela de funcionários

## Arquivos afetados
- **Migration SQL** (3 colunas novas em `profiles`)
- `src/pages/admin/AdminEmployees.tsx` (formulário + tabela + email opcional)
- `src/pages/admin/AdminFinanceiro.tsx` (margem real + tabela atualizada)

