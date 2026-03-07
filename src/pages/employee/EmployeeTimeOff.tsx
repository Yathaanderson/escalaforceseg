import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDate, folgaStatusLabel, folgaStatusStyle } from '@/lib/formatters';

export default function EmployeeTimeOff() {
  const { user } = useAuth();
  const [data, setData] = useState('');
  const [motivo, setMotivo] = useState('');
  const qc = useQueryClient();

  const { data: meusPedidos = [] } = useQuery({
    queryKey: ['meus-pedidos-folga', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pedidos_folga')
        .select('*')
        .eq('funcionario_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('pedidos_folga').insert({
        funcionario_id: user!.id,
        datas: [data],
        motivo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meus-pedidos-folga'] });
      setData(''); setMotivo('');
      toast.success('Solicitação enviada com sucesso!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground">Pedido de Folga</h1>

      <div className="card-plantao space-y-4">
        <h2 className="font-bold text-foreground">Nova solicitação</h2>
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Data desejada</label>
            <Input type="date" value={data} onChange={e => setData(e.target.value)} required className="h-12 text-base" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Motivo</label>
            <Input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex: Consulta médica" required className="h-12 text-base" />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold gap-2" disabled={createMutation.isPending}>
            <Send size={18} /> {createMutation.isPending ? 'Enviando...' : 'Enviar solicitação'}
          </Button>
        </form>
      </div>

      <h2 className="section-title">Minhas solicitações</h2>
      <div className="space-y-2">
        {meusPedidos.map(pedido => (
          <div key={pedido.id} className="card-plantao flex items-center justify-between py-3">
            <div>
              <p className="font-semibold text-foreground text-sm">
                {pedido.datas.map(d => formatDate(d)).join(', ')}
              </p>
              <p className="text-xs text-muted-foreground">{pedido.motivo}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${folgaStatusStyle[pedido.status]}`}>
              {folgaStatusLabel[pedido.status]}
            </span>
          </div>
        ))}
        {meusPedidos.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">Nenhuma solicitação</p>
        )}
      </div>
    </div>
  );
}
