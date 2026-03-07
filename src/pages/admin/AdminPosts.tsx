import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminPosts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nomeCliente, setNomeCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [tipoServico, setTipoServico] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const qc = useQueryClient();

  const { data: postos = [] } = useQuery({
    queryKey: ['postos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('postos').select('*').order('nome_cliente');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('postos').insert({
        nome_cliente: nomeCliente, endereco, tipo_servico: tipoServico, observacoes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['postos'] });
      setDialogOpen(false);
      setNomeCliente(''); setEndereco(''); setTipoServico(''); setObservacoes('');
      toast.success('Posto criado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-11"><Plus size={18} /> Novo posto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Posto</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); createMutation.mutate(); }}>
              <Input placeholder="Nome do cliente" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} className="h-11" required />
              <Input placeholder="Endereço" value={endereco} onChange={e => setEndereco(e.target.value)} className="h-11" required />
              <Input placeholder="Tipo de serviço" value={tipoServico} onChange={e => setTipoServico(e.target.value)} className="h-11" />
              <Input placeholder="Observações" value={observacoes} onChange={e => setObservacoes(e.target.value)} className="h-11" />
              <Button type="submit" className="w-full h-11" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {postos.map(p => (
          <div key={p.id} className="bg-card rounded-xl p-5 border border-border shadow-sm space-y-2">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">{p.nome_cliente}</h3>
                <p className="text-sm text-muted-foreground">{p.endereco}</p>
              </div>
            </div>
            <div className="bg-muted rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground">Serviço</p>
              <p className="text-sm font-medium text-foreground">{p.tipo_servico}</p>
            </div>
            {p.observacoes && <p className="text-xs text-muted-foreground">{p.observacoes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
