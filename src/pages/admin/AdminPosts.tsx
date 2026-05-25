import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MapPin, Pencil, Trash2, DollarSign, CalendarDays, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminPosts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nomeCliente, setNomeCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [tipoServico, setTipoServico] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [valorMensal, setValorMensal] = useState('');
  const [diaPagamento, setDiaPagamento] = useState('1');
  const qc = useQueryClient();

  const { data: postos = [] } = useQuery({
    queryKey: ['postos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('postos').select('*').order('nome_cliente');
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setNomeCliente(''); setEndereco(''); setTipoServico(''); setObservacoes('');
    setValorMensal(''); setDiaPagamento('1');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('postos').insert({
        nome_cliente: nomeCliente, endereco, tipo_servico: tipoServico, observacoes,
        valor_mensal: Number(valorMensal) || 0,
        dia_pagamento: Number(diaPagamento) || 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['postos'] });
      setDialogOpen(false); resetForm();
      toast.success('Posto criado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase.from('postos').update({
        nome_cliente: nomeCliente, endereco, tipo_servico: tipoServico, observacoes,
        valor_mensal: Number(valorMensal) || 0,
        dia_pagamento: Number(diaPagamento) || 1,
      }).eq('id', editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['postos'] });
      setDialogOpen(false); resetForm();
      toast.success('Posto atualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('postos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['postos'] });
      toast.success('Posto excluído');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setNomeCliente(p.nome_cliente);
    setEndereco(p.endereco);
    setTipoServico(p.tipo_servico || '');
    setObservacoes(p.observacoes || '');
    setValorMensal(String(p.valor_mensal || 0));
    setDiaPagamento(String(p.dia_pagamento || 1));
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-11" onClick={() => resetForm()}><Plus size={18} /> Novo posto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Editar Posto' : 'Novo Posto'}</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); editingId ? updateMutation.mutate() : createMutation.mutate(); }}>
              <Input placeholder="Nome do cliente" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} className="h-11" required />
              <Input placeholder="Endereço" value={endereco} onChange={e => setEndereco(e.target.value)} className="h-11" required />
              <Input placeholder="Tipo de serviço" value={tipoServico} onChange={e => setTipoServico(e.target.value)} className="h-11" />
              <Input placeholder="Valor mensal (R$)" type="number" step="0.01" min="0" value={valorMensal} onChange={e => setValorMensal(e.target.value)} className="h-11" />
              <Input placeholder="Dia de pagamento (1-31)" type="number" min="1" max="31" value={diaPagamento} onChange={e => setDiaPagamento(e.target.value)} className="h-11" />
              <Input placeholder="Observações" value={observacoes} onChange={e => setObservacoes(e.target.value)} className="h-11" />
              <Button type="submit" className="w-full h-11" disabled={editingId ? updateMutation.isPending : createMutation.isPending}>
                {editingId ? (updateMutation.isPending ? 'Salvando...' : 'Salvar alterações') : (createMutation.isPending ? 'Salvando...' : 'Salvar')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {postos.map((p: any) => (
          <div key={p.id} className="bg-card rounded-xl p-5 border border-border shadow-sm space-y-2 group">
            <div className="flex items-start justify-between gap-2">
              <Link to={`/admin/posto/${p.id}`} className="flex items-start gap-3 min-w-0 hover:opacity-80 transition-opacity">
                <MapPin size={20} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground">{p.nome_cliente}</h3>
                  <p className="text-sm text-muted-foreground">{p.endereco}</p>
                </div>
              </Link>
              <div className="flex gap-1 shrink-0">
                <Link to={`/admin/posto/${p.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver dashboard do posto">
                    <BarChart3 size={14} />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}>
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <div className="bg-muted rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground">Serviço</p>
              <p className="text-sm font-medium text-foreground">{p.tipo_servico || '—'}</p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <DollarSign size={14} className="text-primary" />
                <span className="font-semibold text-foreground">{formatBRL(Number(p.valor_mensal) || 0)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays size={14} />
                <span>Dia {p.dia_pagamento || 1}</span>
              </div>
            </div>
            {p.observacoes && <p className="text-xs text-muted-foreground">{p.observacoes}</p>}
            <Link to={`/admin/posto/${p.id}`} className="block">
              <Button variant="outline" size="sm" className="w-full gap-2 mt-1 text-xs">
                <BarChart3 size={14} /> Ver dashboard
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
