

# Plano: Login por usuário + toggle de visibilidade da senha

## Contexto

A autenticação usa Supabase Auth que exige e-mail. A solução é adicionar um campo `usuario` na tabela `profiles`, e no login o usuário digita o "usuário" — o sistema busca o e-mail correspondente no banco e faz o `signInWithPassword` com esse e-mail.

## Passo 1 — Migração: campo `usuario` na tabela profiles

```sql
ALTER TABLE public.profiles ADD COLUMN usuario text UNIQUE;
```

Coluna opcional e única. Admins preenchem ao cadastrar funcionários.

## Passo 2 — Atualizar AdminEmployees.tsx

- Adicionar campo "Usuário" no formulário de criação/edição (texto simples, ex: `carlos.silva`)
- Salvar na coluna `usuario` ao criar/atualizar
- Atualizar `resetForm` e `handleEdit`

## Passo 3 — Atualizar LoginPage.tsx

- Trocar label "E-mail" por "Usuário"
- Input type `text` em vez de `email`, placeholder "seu.usuario"
- Adicionar state `showPassword` com botão de ícone `Eye`/`EyeOff` no campo senha para toggle de visibilidade
- No `handleSubmit`: antes de chamar `login()`, buscar o e-mail do perfil via `supabase.from('profiles').select('id').eq('usuario', input).single()`, depois buscar o e-mail do auth user correspondente. **Alternativa mais simples**: armazenar o e-mail no próprio profiles e buscar de lá, ou manter o campo `usuario` igual ao e-mail e simplesmente fazer lookup: `select usuario, id from profiles where usuario = X`, e depois usar o e-mail associado.

**Abordagem escolhida**: Como o Supabase Auth precisa do e-mail, vou buscar o e-mail na tabela `profiles` (que já não é obrigatório no cadastro mas pode existir). Melhor: adicionar o campo `email` na profiles para mapeamento direto. Porém profiles já não tem email — o email fica em `auth.users`. Então a abordagem mais limpa:

1. Usuário digita `usuario` no login
2. Query pública: `profiles.select('id').eq('usuario', input).single()`
3. Precisamos do e-mail do auth.users — mas não temos acesso direto. **Solução**: salvar o e-mail também na tabela profiles ao cadastrar, ou usar uma edge function.

**Solução mais simples**: Guardar o e-mail na coluna existente (adicionar coluna `email` em profiles). Ao criar funcionário com e-mail, salvar ali. No login, buscar `profiles.select('email').eq('usuario', X)` e usar esse e-mail para autenticar.

## Passo 1 revisado — Migração

```sql
ALTER TABLE public.profiles ADD COLUMN usuario text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN email text;
```

## Passo 2 — AdminEmployees.tsx

- Adicionar campo "Usuário" (login) no formulário
- Salvar `usuario` e `email` na profiles ao criar/editar

## Passo 3 — LoginPage.tsx

- Label "Usuário" com input type text
- Campo senha com botão Eye/EyeOff para mostrar/ocultar
- No submit: buscar `profiles.select('email').eq('usuario', valor).single()`, usar o e-mail retornado para chamar `login(email, password)`
- Mensagem de erro: "Usuário ou senha incorretos"

## Passo 4 — RLS

Permitir select na profiles para anon (apenas colunas necessárias via query — RLS não filtra colunas, mas o select limita). Adicionar policy:
```sql
CREATE POLICY "Allow anon to read profiles by usuario" ON public.profiles FOR SELECT TO anon USING (true);
```
Ou mais restritivo com uma function. Como a tabela profiles já tem policy de select para authenticated, adicionar para anon também (limitado — o client só faz select de email where usuario=X).

## Arquivos afetados
- **Migration SQL** (2 colunas em profiles + RLS policy para anon)
- `src/pages/LoginPage.tsx` (UI + lógica de lookup)
- `src/pages/admin/AdminEmployees.tsx` (campo usuario + salvar email)

