import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatTime } from '@/lib/formatters';

export default function AdminShifts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const qc = useQueryClient();

  const { data: turnos = [] } = useQuery({
    queryKey: ['turnos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('turnos').select('*').order('hora_inicio');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('turnos').insert({
        nome, hora_inicio: horaInicio, hora_fim: horaFim,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['turnos'] });
      setDialogOpen(false);
      setNome(''); setHoraInicio(''); setHoraFim('');
      toast.success('Turno criado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-11"><Plus size={18} /> Novo turno</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Turno</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); createMutation.mutate(); }}>
              <Input placeholder="Nome do turno (ex: Diurno)" value={nome} onChange={e => setNome(e.target.value)} className="h-11" required />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Início</label>
                  <Input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className="h-11" required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Fim</label>
                  <Input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} className="h-11" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {turnos.map(t => (
          <div key={t.id} className="bg-card rounded-xl p-5 border border-border shadow-sm text-center">
            <Clock size={24} className="text-primary mx-auto mb-2" />
            <h3 className="font-bold text-foreground text-lg">{t.nome}</h3>
            <p className="text-xl font-semibold text-foreground mt-1">{formatTime(t.hora_inicio)} – {formatTime(t.hora_fim)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
