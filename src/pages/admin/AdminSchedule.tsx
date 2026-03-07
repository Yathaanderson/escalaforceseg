import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDate, formatTime, statusLabels, statusColors } from '@/lib/formatters';

export default function AdminSchedule() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [funcionarioId, setFuncionarioId] = useState('');
  const [postoId, setPostoId] = useState('');
  const [turnoId, setTurnoId] = useState('');
  const [data, setData] = useState('');
  const qc = useQueryClient();

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
    queryKey: ['escalas'],
    queryFn: async () => {
      const { data } = await supabase
        .from('escalas')
        .select('*, profiles!escalas_funcionario_id_fkey(nome), postos(nome_cliente), turnos(hora_inicio, hora_fim)')
        .order('data');
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('escalas').insert({
        funcionario_id: funcionarioId, posto_id: postoId, turno_id: turnoId, data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalas'] });
      setDialogOpen(false);
      setFuncionarioId(''); setPostoId(''); setTurnoId(''); setData('');
      toast.success('Escala criada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-11"><Plus size={18} /> Nova escala</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Escala</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); createMutation.mutate(); }}>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Funcionário</label>
                <Select value={funcionarioId} onValueChange={setFuncionarioId}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {funcionarios.map(f => (
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
                    {postos.map(p => (
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
                    {turnos.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.nome} ({formatTime(t.hora_inicio)}–{formatTime(t.hora_fim)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Data</label>
                <Input type="date" value={data} onChange={e => setData(e.target.value)} className="h-11" required />
              </div>
              <Button type="submit" className="w-full h-11" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar escala'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-foreground">Data</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Funcionário</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground hidden sm:table-cell">Posto</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground hidden md:table-cell">Turno</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {escalas.map((e: any) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{formatDate(e.data)}</td>
                  <td className="px-4 py-3 text-foreground">{e.profiles?.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{e.postos?.nome_cliente}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {formatTime(e.turnos?.hora_inicio || '')} – {formatTime(e.turnos?.hora_fim || '')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[e.status as keyof typeof statusColors]}`}>
                      {statusLabels[e.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
