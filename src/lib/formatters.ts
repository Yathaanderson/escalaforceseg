import type { Database } from '@/integrations/supabase/types';

export type EscalaStatus = Database['public']['Enums']['escala_status'];
export type FolgaStatus = Database['public']['Enums']['folga_status'];

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

export function formatTime(timeStr: string): string {
  // timeStr from DB is "HH:MM:SS", we want "HH:MM"
  return timeStr.slice(0, 5);
}

export const statusLabels: Record<EscalaStatus, string> = {
  planejado: 'Planejado',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  falta: 'Falta',
  precisa_cobertura: 'Precisa cobertura',
};

export const statusColors: Record<EscalaStatus, string> = {
  planejado: 'bg-info text-info-foreground',
  confirmado: 'bg-success text-success-foreground',
  concluido: 'bg-muted text-muted-foreground',
  falta: 'bg-destructive text-destructive-foreground',
  precisa_cobertura: 'bg-warning text-warning-foreground',
};

export const folgaStatusLabel: Record<FolgaStatus, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

export const folgaStatusStyle: Record<FolgaStatus, string> = {
  pendente: 'bg-warning text-warning-foreground',
  aprovado: 'bg-success text-success-foreground',
  rejeitado: 'bg-destructive text-destructive-foreground',
};
