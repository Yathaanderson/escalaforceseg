

# Plano: Corrigir cadastro de funcionário sem conta de autenticação

## Problema

A tabela `profiles` tem uma foreign key `profiles_id_fkey` apontando para `auth.users(id)`. Ao criar um funcionário sem e-mail (sem conta auth), o código gera um UUID aleatório que não existe em `auth.users`, causando o erro 409.

## Solução

Remover a foreign key constraint `profiles_id_fkey` da tabela `profiles`. Isso permite que perfis existam independentemente de contas de autenticação -- necessário para funcionários cadastrados apenas como perfil (sem login).

## Passo 1 -- Migração SQL

```sql
ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
```

## Passo 2 -- Nenhuma alteração de código necessária

O código em `AdminEmployees.tsx` já está correto: gera UUID e insere diretamente na profiles quando não há e-mail.

## Arquivos afetados
- **Migration SQL** (remover foreign key)

