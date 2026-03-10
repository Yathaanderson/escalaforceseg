# EscalaPro - Sistema de Escala de Segurança

## Design System
- Primary: Navy blue (215 80% 28%)
- Success: Green (150 60% 40%) - for check-in
- Warning: Amber (38 92% 50%) - for check-out, pending items
- Mobile-first: 18px base font on mobile, large touch targets (min 64px height)
- Font: Inter
- High contrast for outdoor/night use

## Architecture
- Auth via Supabase Auth + AuthContext (admin/funcionario roles)
- Login by "usuario" field (maps to email in profiles table for Supabase Auth)
- Employee routes: /app, /app/escala, /app/avisos, /app/folgas
- Admin routes: /admin, /admin/funcionarios, /admin/postos, /admin/turnos, /admin/escala, /admin/folgas, /admin/avisos
- Bottom nav for employee, sidebar for admin

## Database
- profiles table has `usuario` (unique, for login) and `email` columns
- Anon RLS policy on profiles for login lookup
- handle_new_user trigger saves email to profiles

## Pending
- Set `usuario` field for existing users via admin panel
