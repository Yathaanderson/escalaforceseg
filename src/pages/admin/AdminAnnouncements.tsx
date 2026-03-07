import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Megaphone, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminAnnouncements() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const qc = useQueryClient();

  const { data: avisos = [] } = useQuery({
    queryKey: ['avisos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('avisos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('avisos').insert({ titulo, texto, data_validade: dataValidade });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['avisos'] });
      setDialogOpen(false);
      setTitulo(''); setTexto(''); setDataValidade('');
      toast.success('Aviso publicado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('avisos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['avisos'] });
      toast.success('Aviso removido');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-11"><Plus size={18} /> Novo aviso</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Aviso</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); createMutation.mutate(); }}>
              <Input placeholder="Título do aviso" value={titulo} onChange={e => setTitulo(e.target.value)} className="h-11" required />
              <textarea
                placeholder="Texto do aviso"
                value={texto}
                onChange={e => setTexto(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Válido até</label>
                <Input type="date" value={dataValidade} onChange={e => setDataValidade(e.target.value)} className="h-11" required />
              </div>
              <Button type="submit" className="w-full h-11" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Publicando...' : 'Publicar aviso'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {avisos.map(a => (
          <div key={a.id} className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Megaphone size={20} className="text-warning mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground">{a.titulo}</h3>
                  <p className="text-sm text-foreground mt-1">{a.texto}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Válido até {new Date(a.data_validade + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0"
                onClick={() => deleteMutation.mutate(a.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
