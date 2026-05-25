import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Copy, Check, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatTime, statusLabels, statusColors } from '@/lib/formatters';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { EscalaStatus } from '@/lib/formatters';

const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEKDAYS_FULL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type CellValue = { posto_id: string; turno_id: string; status: EscalaStatus } | null;
type GridData = Record<string, Record<string, CellValue>>; // funcionario_id -> data -> cell

export default function AdminSchedule() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPosto, setSelectedPosto] = useState<string>('all');
  const [copiedWeek, setCopiedWeek] = useState<number | null>(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);
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
        .select('*')
        .gte('data', format(monthStart, 'yyyy-MM-dd'))
        .lte('data', format(monthEnd, 'yyyy-MM-dd'))
        .order('data');
      return data || [];
    },
  });

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentMonth]);

  // Build grid data from escalas
  const gridData: GridData = useMemo(() => {
    const grid: GridData = {};
    escalas.forEach((e: any) => {
      if (!grid[e.funcionario_id]) grid[e.funcionario_id] = {};
      grid[e.funcionario_id][e.data] = {
        posto_id: e.posto_id,
        turno_id: e.turno_id,
        status: e.status,
      };
    });
    return grid;
  }, [escalas]);

  // Local edits (not yet saved)
  const [localEdits, setLocalEdits] = useState<GridData>({});

  const getCell = useCallback((funcId: string, date: string): CellValue => {
    return localEdits[funcId]?.[date] ?? gridData[funcId]?.[date] ?? null;
  }, [gridData, localEdits]);

  const setCell = useCallback((funcId: string, date: string, value: CellValue) => {
    setLocalEdits(prev => {
      const newEdits = { ...prev };
      if (!newEdits[funcId]) newEdits[funcId] = {};
      if (value === null) {
        // Mark for deletion
        newEdits[funcId][date] = { posto_id: '__DELETE__', turno_id: '__DELETE__', status: 'planejado' };
      } else {
        newEdits[funcId][date] = value;
      }
      setHasUnsaved(true);
      return newEdits;
    });
  }, []);

  // Save all changes
  const saveMutation = useMutation({
    mutationFn: async () => {
      const errors: string[] = [];

      for (const [funcId, dates] of Object.entries(localEdits)) {
        for (const [date, cell] of Object.entries(dates)) {
          if (cell?.posto_id === '__DELETE__') {
            // Delete existing escala
            const { error } = await supabase
              .from('escalas')
              .delete()
              .eq('funcionario_id', funcId)
              .eq('data', date);
            if (error) errors.push(`${date}: ${error.message}`);
          } else if (cell) {
            // Check if escala exists
            const existing = escalas.find((e: any) => e.funcionario_id === funcId && e.data === date);
            if (existing) {
              const { error } = await supabase
                .from('escalas')
                .update({ posto_id: cell.posto_id, turno_id: cell.turno_id, status: cell.status })
                .eq('id', existing.id);
              if (error) errors.push(`${date}: ${error.message}`);
            } else {
              const { error } = await supabase
                .from('escalas')
                .insert({ funcionario_id: funcId, data: date, posto_id: cell.posto_id, turno_id: cell.turno_id, status: cell.status || 'planejado' });
              if (error) errors.push(`${date}: ${error.message}`);
            }
          }
        }
      }

      if (errors.length > 0) throw new Error(errors.join('; '));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalas'] });
      setLocalEdits({});
      setHasUnsaved(false);
      toast.success('Escala salva com sucesso!');
    },
    onError: (err: any) => toast.error('Erro ao salvar: ' + err.message),
  });

  // Copy week pattern
  const handleCopyWeek = (weekNum: number) => {
    setCopiedWeek(weekNum);
    toast.info('Semana copiada! Clique em "Colar" na semana destino.');
  };

  const handlePasteWeek = (targetWeekNum: number) => {
    if (!copiedWeek) return;

    const weekDays = calendarDays.filter(d => getWeekNumber(d) === copiedWeek);
    const targetDays = calendarDays.filter(d => getWeekNumber(d) === targetWeekNum);

    funcionarios.forEach(func => {
      weekDays.forEach((srcDay, i) => {
        const srcDate = format(srcDay, 'yyyy-MM-dd');
        if (i < targetDays.length) {
          const targetDate = format(targetDays[i], 'yyyy-MM-dd');
          const cell = getCell(func.id, srcDate);
          if (cell && cell.posto_id !== '__DELETE__') {
            setCell(func.id, targetDate, { ...cell, status: 'planejado' });
          }
        }
      });
    });

    setCopiedWeek(null);
    toast.success('Semana colada! Revise e salve.');
  };

  const getWeekNumber = (date: Date): number => {
    return Math.ceil((date.getDate() + startOfMonth(currentMonth).getDay()) / 7);
  };

  // Fill entire row (one funcionario, all month) with same posto/turno
  const [fillFuncId, setFillFuncId] = useState<string | null>(null);
  const [fillPosto, setFillPosto] = useState('');
  const [fillTurno, setFillTurno] = useState('');

  const handleFillRow = () => {
    if (!fillFuncId || !fillPosto || !fillTurno) return;
    // Only fill weekdays
    calendarDays.forEach(day => {
      if (!isWeekend(day)) {
        const date = format(day, 'yyyy-MM-dd');
        const existing = getCell(fillFuncId, date);
        if (!existing || existing.posto_id === '__DELETE__') {
          setCell(fillFuncId, date, { posto_id: fillPosto, turno_id: fillTurno, status: 'planejado' });
        }
      }
    });
    setFillFuncId(null);
    setFillPosto('');
    setFillTurno('');
    toast.success('Dias úteis preenchidos!');
  };

  // Quick fill: assign all weekdays for selected funcionario
  const [quickFillOpen, setQuickFillOpen] = useState(false);

  // Stats
  const monthStats = useMemo(() => {
    const data = gridData;
    let totalEscalas = 0;
    let faltas = 0;
    let coberturas = 0;
    let confirmados = 0;
    const postoCount: Record<string, number> = {};

    escalas.forEach((e: any) => {
      totalEscalas++;
      if (e.status === 'falta') faltas++;
      if (e.status === 'precisa_cobertura') coberturas++;
      if (e.status === 'confirmado') confirmados++;
      postoCount[e.posto_id] = (postoCount[e.posto_id] || 0) + 1;
    });

    // Check for uncovered postos (posto with no escala on any given day)
    const uncoveredDays = new Set<string>();
    const allDays = calendarDays.map(d => format(d, 'yyyy-MM-dd'));
    postos.forEach((posto: any) => {
      allDays.forEach(day => {
        const hasVigilante = escalas.some((e: any) => e.posto_id === posto.id && e.data === day);
        if (!hasVigilante) uncoveredDays.add(`${posto.id}-${day}`);
      });
    });

    return { totalEscalas, faltas, coberturas, confirmados, uncoveredCount: uncoveredDays.size, postoCount };
  }, [escalas, postos, calendarDays]);

  const getPostoColor = (postoId: string): string => {
    const colors = [
      'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
      'bg-purple-500/20 text-purple-700 dark:text-purple-300',
      'bg-orange-500/20 text-orange-700 dark:text-orange-300',
      'bg-pink-500/20 text-pink-700 dark:text-pink-300',
      'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
      'bg-amber-500/20 text-amber-700 dark:text-amber-300',
      'bg-rose-500/20 text-rose-700 dark:text-rose-300',
    ];
    const index = postos.findIndex((p: any) => p.id === postoId);
    return colors[index % colors.length];
  };

  const getTurnoShort = (turnoId: string): string => {
    const turno = turnos.find((t: any) => t.id === turnoId);
    if (!turno) return '?';
    const nome = turno.nome as string;
    return nome.charAt(0).toUpperCase() + nome.slice(1, 3);
  };

  return (
    <div className="space-y-4">
      {/* Header with month nav + stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft size={18} />
          </Button>
          <h3 className="text-lg font-bold text-foreground capitalize min-w-[180px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight size={18} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Hoje
          </Button>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-foreground">{monthStats.totalEscalas} escalas</span>
          <span className="text-success font-medium">{monthStats.confirmados} confirmados</span>
          {monthStats.faltas > 0 && (
            <span className="text-destructive font-medium flex items-center gap-1">
              <X size={14} />{monthStats.faltas} faltas
            </span>
          )}
          {monthStats.coberturas > 0 && (
            <span className="text-warning font-medium flex items-center gap-1">
              <AlertTriangle size={14} />{monthStats.coberturas} coberturas
            </span>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setQuickFillOpen(!quickFillOpen)}
        >
          <Copy size={14} />
          Preenchimento rápido
        </Button>
        {hasUnsaved && (
          <Button size="sm" className="gap-2" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Check size={14} />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        )}
        {hasUnsaved && (
          <Button variant="ghost" size="sm" onClick={() => { setLocalEdits({}); setHasUnsaved(false); }}>
            Descartar
          </Button>
        )}
      </div>

      {/* Quick fill panel */}
      {quickFillOpen && (
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-foreground">Preenchimento rápido — preenche todos os dias úteis do mês</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Funcionário</label>
              <Select value={fillFuncId || ''} onValueChange={setFillFuncId}>
                <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {funcionarios.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Posto</label>
              <Select value={fillPosto} onValueChange={setFillPosto}>
                <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {postos.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome_cliente}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Turno</label>
              <Select value={fillTurno} onValueChange={setFillTurno}>
                <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {turnos.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome} ({formatTime(t.hora_inicio)}–{formatTime(t.hora_fim)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="h-9" onClick={handleFillRow} disabled={!fillFuncId || !fillPosto || !fillTurno}>
              Preencher dias úteis
            </Button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold text-muted-foreground">Postos:</span>
        {postos.map((p: any) => (
          <span key={p.id} className={`px-2 py-0.5 rounded font-medium ${getPostoColor(p.id)}`}>
            {p.nome_cliente}
          </span>
        ))}
        <span className="ml-2 font-semibold text-muted-foreground">Turnos:</span>
        {turnos.map((t: any) => (
          <span key={t.id} className="text-muted-foreground">
            {t.nome} ({formatTime(t.hora_inicio)}–{formatTime(t.hora_fim)})
          </span>
        ))}
      </div>

      {/* GRID — the main editable schedule */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-3 py-2 font-semibold text-foreground sticky left-0 bg-muted/50 z-10 min-w-[140px]">
                Funcionário
              </th>
              {calendarDays.map(day => {
                const today = isToday(day);
                const weekend = isWeekend(day);
                return (
                  <th
                    key={format(day, 'yyyy-MM-dd')}
                    className={`text-center px-1 py-2 font-semibold min-w-[36px] ${today ? 'bg-primary/10 text-primary' : weekend ? 'text-muted-foreground/60' : 'text-foreground'}`}
                  >
                    <div className="text-[10px] leading-none">{WEEKDAYS_SHORT[getDay(day)]}</div>
                    <div className={`text-xs mt-0.5 ${today ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center mx-auto text-[11px]' : ''}`}>
                      {format(day, 'd')}
                    </div>
                  </th>
                );
              })}
              <th className="text-center px-3 py-2 font-semibold text-muted-foreground min-w-[50px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.map((func: any) => {
              const funcCellDays = calendarDays.filter(day => {
                const cell = getCell(func.id, format(day, 'yyyy-MM-dd'));
                return cell && cell.posto_id !== '__DELETE__';
              });
              const totalDias = funcCellDays.length;

              return (
                <tr key={func.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                  <td className="px-3 py-1.5 sticky left-0 bg-card z-10 border-r border-border">
                    <p className="font-medium text-foreground text-sm leading-tight">{func.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{func.funcao || 'Vigilante'}</p>
                  </td>
                  {calendarDays.map(day => {
                    const date = format(day, 'yyyy-MM-dd');
                    const cell = getCell(func.id, date);
                    const today = isToday(day);
                    const weekend = isWeekend(day);
                    const hasValue = cell && cell.posto_id !== '__DELETE__';

                    return (
                      <td
                        key={date}
                        className={`text-center px-0.5 py-1 border-r border-border/50 ${today ? 'bg-primary/5' : weekend ? 'bg-muted/30' : ''} ${cell?.status === 'falta' ? 'bg-destructive/10' : cell?.status === 'precisa_cobertura' ? 'bg-warning/10' : ''}`}
                      >
                        {hasValue ? (
                          <CellEditor
                            cell={cell!}
                            postoId={cell!.posto_id}
                            postoColor={getPostoColor(cell!.posto_id)}
                            turnoShort={getTurnoShort(cell!.turno_id)}
                            turnos={turnos}
                            postos={postos}
                            onChange={(newPosto, newTurno) => {
                              setCell(func.id, date, { posto_id: newPosto, turno_id: newTurno, status: cell!.status });
                            }}
                            onStatusChange={(newStatus) => {
                              setCell(func.id, date, { ...cell!, status: newStatus });
                            }}
                            onDelete={() => {
                              setCell(func.id, date, null);
                            }}
                          />
                        ) : (
                          <EmptyCell
                            postos={postos}
                            turnos={turnos}
                            onAdd={(postoId, turnoId) => {
                              setCell(func.id, date, { posto_id: postoId, turno_id: turnoId, status: 'planejado' });
                            }}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center px-2 py-1 font-bold text-sm text-foreground">
                    {totalDias}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Posto summary at bottom */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {postos.map((posto: any) => {
          const count = monthStats.postoCount[posto.id] || 0;
          const funcionariosNoPosto = [...new Set(
            escalas.filter((e: any) => e.posto_id === posto.id).map((e: any) => e.funcionario_id)
          )].length;
          return (
            <div key={posto.id} className={`rounded-xl p-3 border border-border shadow-sm ${getPostoColor(posto.id)}`}>
              <p className="font-bold text-sm">{posto.nome_cliente}</p>
              <p className="text-xs opacity-70">{count} escalas · {funcionariosNoPosto} vigilantes</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Cell Components ---

function CellEditor({ cell, postoId, postoColor, turnoShort, turnos, postos, onChange, onStatusChange, onDelete }: {
  cell: CellValue;
  postoId: string;
  postoColor: string;
  turnoShort: string;
  turnos: any[];
  postos: any[];
  onChange: (postoId: string, turnoId: string) => void;
  onStatusChange: (status: EscalaStatus) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="space-y-1" onClick={e => e.stopPropagation()}>
        <Select value={cell!.posto_id} onValueChange={(v) => { onChange(v, cell!.turno_id); }}>
          <SelectTrigger className="h-6 text-xs w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {postos.map((p: any) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">{p.nome_cliente}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cell!.turno_id} onValueChange={(v) => { onChange(cell!.posto_id, v); }}>
          <SelectTrigger className="h-6 text-xs w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {turnos.map((t: any) => (
              <SelectItem key={t.id} value={t.id} className="text-xs">{t.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => setEditing(false)}>
            <Check size={12} />
          </Button>
          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-destructive hover:text-destructive" onClick={onDelete}>
            <X size={12} />
          </Button>
        </div>
      </div>
    );
  }

  const status = cell?.status || 'planejado';
  const isFalta = status === 'falta';
  const isCobertura = status === 'precisa_cobertura';

  return (
    <button
      onClick={() => setEditing(true)}
      onContextMenu={(e) => {
        e.preventDefault();
        // Quick status cycle: planejado -> confirmado -> concluido -> falta -> precisa_cobertura -> planejado
        const statuses: EscalaStatus[] = ['planejado', 'confirmado', 'concluido', 'falta', 'precisa_cobertura'];
        const currentIdx = statuses.indexOf(status);
        const next = statuses[(currentIdx + 1) % statuses.length];
        onStatusChange(next);
      }}
      className={`w-full h-full min-h-[28px] rounded px-0.5 py-0.5 cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 active:scale-95 ${postoColor} ${isFalta ? 'ring-1 ring-destructive' : isCobertura ? 'ring-1 ring-warning' : ''}`}
      title={`${postos.find((p: any) => p.id === postoId)?.nome_cliente || ''} | ${turnos.find((t: any) => t.id === cell?.turno_id)?.nome || ''} | ${statusLabels[status]} | Clique direito: mudar status`}
    >
      <div className="text-[10px] font-bold leading-none">{turnoShort}</div>
      {isFalta && <div className="text-[8px] text-destructive font-bold">F</div>}
      {isCobertura && <div className="text-[8px] text-warning font-bold">C</div>}
      {(status === 'confirmado') && <div className="text-[8px] text-success">✓</div>}
    </button>
  );
}

function EmptyCell({ postos, turnos, onAdd }: {
  postos: any[];
  turnos: any[];
  onAdd: (postoId: string, turnoId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [selectedPosto, setSelectedPosto] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('');

  if (editing) {
    return (
      <div className="space-y-1" onClick={e => e.stopPropagation()}>
        <Select value={selectedPosto} onValueChange={setSelectedPosto}>
          <SelectTrigger className="h-6 text-xs w-full"><SelectValue placeholder="Posto" /></SelectTrigger>
          <SelectContent>
            {postos.map((p: any) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">{p.nome_cliente}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedTurno} onValueChange={setSelectedTurno}>
          <SelectTrigger className="h-6 text-xs w-full"><SelectValue placeholder="Turno" /></SelectTrigger>
          <SelectContent>
            {turnos.map((t: any) => (
              <SelectItem key={t.id} value={t.id} className="text-xs">{t.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-5 px-1"
            disabled={!selectedPosto || !selectedTurno}
            onClick={() => {
              onAdd(selectedPosto, selectedTurno);
              setEditing(false);
              setSelectedPosto('');
              setSelectedTurno('');
            }}
          >
            <Check size={12} className="text-success" />
          </Button>
          <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => { setEditing(false); setSelectedPosto(''); setSelectedTurno(''); }}>
            <X size={12} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full h-full min-h-[28px] rounded cursor-pointer transition-colors hover:bg-primary/10 flex items-center justify-center"
      title="Clique para adicionar escala"
    >
      <span className="text-muted-foreground/30 text-xs">+</span>
    </button>
  );
}
