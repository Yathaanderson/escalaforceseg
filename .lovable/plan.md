

# Plano: Ativar Lovable Cloud com Supabase

## Resumo

Migrar o sistema EscalaPro de dados mock para um banco PostgreSQL real via Lovable Cloud (Supabase), com autenticação, tabelas relacionais e RLS.

## Passo 1 — Ativar Cloud

Precisamos primeiro ativar o Lovable Cloud para ter acesso ao banco de dados PostgreSQL e autenticação.

## Passo 2 — Schema do Banco de Dados

Criar as seguintes tabelas via migrações:

1. **profiles** — id (FK auth.users), nome, cpf, telefone, funcao, ativo, role (via enum app_role)
2. **user_roles** — user_id, role (enum: admin, funcionario) — para controle seguro de permissões
3. **postos** — id, nome_cliente, endereco, tipo_servico, observacoes
4. **turnos** — id, nome, hora_inicio, hora_fim
5. **escalas** — id, funcionario_id (FK profiles), posto_id, turno_id, data, status (enum: planejado, confirmado, concluido, falta, precisa_cobertura)
6. **checkins** — id, escala_id, tipo (checkin/checkout), data_hora, observacao
7. **pedidos_folga** — id, funcionario_id, datas (date[]), motivo, status (pendente/aprovado/rejeitado), criado_em
8. **avisos** — id, titulo, texto, data_validade, criado_em

Constraint de unicidade em escalas (funcionario_id, data, turno_id) para impedir sobreposição.

## Passo 3 — RLS e Segurança

- Função `has_role()` (SECURITY DEFINER) para verificar roles sem recursão
- Admin: leitura/escrita em todas as tabelas
- Funcionário: leitura própria em escalas/checkins/pedidos_folga, leitura global em avisos/postos/turnos
- Funcionário: escrita em checkins (próprios) e pedidos_folga (próprios)

## Passo 4 — Autenticação

- Substituir AuthContext mock por Supabase Auth (`onAuthStateChange` + `getSession`)
- Trigger para criar profile automaticamente no signup
- Login com email/senha

## Passo 5 — Integração no Frontend

- Criar cliente Supabase (`src/integrations/supabase/client.ts`)
- Substituir imports de `mockData` por queries Supabase em todas as páginas
- Usar React Query para fetching/caching
- Manter a mesma UI, apenas trocar a fonte de dados

## Passo 6 — Seed de Dados Iniciais

- Inserir dados de demonstração (postos, turnos, avisos) via insert tool
- Criar usuários admin e funcionário de teste

## Arquivos Afetados

- **Novos**: migrations SQL, `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`
- **Editados**: `AuthContext.tsx`, todas as páginas admin e employee, `App.tsx`
- **Removido**: dependência de `mockData.ts` (arquivo mantido como referência)

