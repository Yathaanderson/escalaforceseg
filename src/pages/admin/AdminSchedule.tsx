import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatTime, statusLabels, statusColors } from '@/lib/formatters';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { EscalaStatus } from '@/lib/formatters';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function AdminSchedule() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [funcionarioId, setFuncionarioId] = useState('');
  const [postoId, setPostoId] = useState('');
  const [turnoId, setTurnoId] = useState('');
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<EscalaStatus>('planejado');
  const qc = useQueryClient();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: funcionarios = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('ativo', true).order('nome');
      return data || [];
    },
  });

  const { data: postos = [] } = useQuery({
    queryKey: ['postos'],
    queryFn: async () => {
      const { data } = await supabase.from('postos').select('*').order('nome_cliente');
      return data || [];
    },
  });

  const { data: turnos = [] } = useQuery({
    queryKey: ['turnos'],
    queryFn: async () => {
      const { data } = await supabase.from('turnos').select('*').order('hora_inicio');
      return data || [];
    },
  });

  const { data: escalas = [] } = useQuery({
    queryKey: ['escalas', format(monthStart, 'yyyy-MM'), format(monthEnd, 'yyyy-MM')],
    queryFn: async () => {
      const { data } = await supabase
        .from('escalas')
        .select('*, profiles!escalas_funcionario_id_fkey(nome), postos(nome_cliente), turnos(hora_inicio, hora_fim, nome)')
        .gte('data', format(monthStart, 'yyyy-MM-dd'))
        .lte('data', format(monthEnd, 'yyyy-MM-dd'))
        .order('data');
      return data || [];
    },
  });

  const escalasByDate = useMemo(() => {
    const map: Record<string, typeof escalas> = {};
    escalas.forEach((e: any) => {
      const key = e.data;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [escalas]);

  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPad = getDay(monthStart);
    return { days, startPad };
  }, [currentMonth]);

  const invalidateEscalas = () => qc.invalidateQueries({ queryKey: ['escalas'] });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate) throw new Error('Data não selecionada');
      const { error } = await supabase.from('escalas').insert({
        funcionario_id: funcionarioId,
        posto_id: postoId,
        turno_id: turnoId,
        data: format(selectedDate, 'yyyy-MM-dd'),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateEscalas();
      resetForm();
      toast.success('Escala criada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase.from('escalas').update({
        funcionario_id: funcionarioId,
        posto_id: postoId,
        turno_id: turnoId,
        status: editStatus,
      }).eq('id', editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateEscalas();
      resetForm();
      toast.success('Escala atualizada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('escalas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateEscalas();
      toast.success('Escala excluída');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setEditingId(null);
    setFuncionarioId('');
    setPostoId('');
    setTurnoId('');
    setEditStatus('planejado');
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (e: any) => {
    setEditingId(e.id);
    setFuncionarioId(e.funcionario_id);
    setPostoId(e.posto_id);
    setTurnoId(e.turno_id);
    setEditStatus(e.status);
  };

  const handleCancelEdit = () => resetForm();

  const statuses: EscalaStatus[] = ['planejado', 'confirmado', 'concluido', 'falta', 'precisa_cobertura'];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
          <ChevronLeft size={18} />
        </Button>
        <h3 className="text-lg font-bold text-foreground capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
          <ChevronRight size={18} />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/50">
          {WEEKDAYS.map(d => (
            <div key={d} className="px-1 py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: calendarDays.startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[80px] lg:min-h-[100px] border-b border-r border-border bg-muted/20" />
          ))}
          {calendarDays.days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEscalas = escalasByDate[dateKey] || [];
            const today = isToday(day);
            return (
              <div
                key={dateKey}
                onClick={() => handleDayClick(day)}
                className={`min-h-[80px] lg:min-h-[100px] border-b border-r border-border p-1 cursor-pointer transition-colors hover:bg-primary/5 ${today ? 'bg-primary/10' : ''}`}
              >
                <div className={`text-xs font-semibold mb-1 flex items-center justify-between ${today ? 'text-primary' : 'text-foreground'}`}>
                  <span className={today ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-[11px]' : ''}>
                    {format(day, 'd')}
                  </span>
                  {dayEscalas.length > 0 && (
                    <span className="bg-primary/20 text-primary text-[10px] font-bold px-1.5 rounded-full">{dayEscalas.length}</span>
                  )}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {dayEscalas.slice(0, 2).map((e: any) => (
                    <div key={e.id} className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${statusColors[e.status as EscalaStatus]}`} title={`${e.profiles?.nome} - ${e.postos?.nome_cliente}`}>
                      {e.profiles?.nome?.split(' ')[0]}
                    </div>
                  ))}
                  {dayEscalas.length > 2 && (
                    <div className="text-[10px] text-muted-foreground font-medium px-1">+{dayEscalas.length - 2} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Escala'}</DialogTitle>
          </DialogHeader>

          {/* Existing escalas for this date */}
          {selectedDate && (escalasByDate[format(selectedDate, 'yyyy-MM-dd')] || []).length > 0 && (
            <div className="space-y-2 mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Escalas neste dia</p>
              {(escalasByDate[format(selectedDate, 'yyyy-MM-dd')] || []).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm gap-2">
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">{e.profiles?.nome}</span>
                    <span className="text-muted-foreground mx-1">·</span>
                    <span className="text-muted-foreground">{e.postos?.nome_cliente}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[e.status as EscalaStatus]}`}>
                      {statusLabels[e.status as EscalaStatus]}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(e)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(e.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form: create or edit */}
          <form className="space-y-3 border-t border-border pt-3" onSubmit={e => { e.preventDefault(); editingId ? updateMutation.mutate() : createMutation.mutate(); }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              {editingId ? <><Pencil size={12} /> Editar escala</> : <><Plus size={12} /> Nova escala</>}
            </p>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Funcionário</label>
              <Select value={funcionarioId} onValueChange={setFuncionarioId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {funcionarios.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Posto</label>
              <Select value={postoId} onValueChange={setPostoId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {postos.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome_cliente}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Turno</label>
              <Select value={turnoId} onValueChange={setTurnoId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {turnos.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome} ({formatTime(t.hora_inicio)}–{formatTime(t.hora_fim)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingId && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Status</label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as EscalaStatus)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => (
                      <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2">
              {editingId && (
                <Button type="button" variant="outline" className="flex-1 h-11" onClick={handleCancelEdit}>Cancelar</Button>
              )}
              <Button type="submit" className="flex-1 h-11" disabled={(editingId ? updateMutation.isPending : createMutation.isPending) || !funcionarioId || !postoId || !turnoId}>
                {editingId
                  ? (updateMutation.isPending ? 'Salvando...' : 'Salvar alterações')
                  : (createMutation.isPending ? 'Criando...' : 'Criar escala')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
