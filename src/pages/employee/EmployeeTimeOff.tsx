import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockPedidosFolga, formatDate } from '@/data/mockData';

export default function EmployeeTimeOff() {
  const { user } = useAuth();
  const funcionarioId = user?.funcionarioId || '1';
  const [data, setData] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviado, setEnviado] = useState(false);

  const meusPedidos = mockPedidosFolga.filter(p => p.funcionarioId === funcionarioId);

  const statusLabel: Record<string, string> = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    rejeitado: 'Rejeitado',
  };
  const statusStyle: Record<string, string> = {
    pendente: 'bg-warning text-warning-foreground',
    aprovado: 'bg-success text-success-foreground',
    rejeitado: 'bg-destructive text-destructive-foreground',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnviado(true);
    setTimeout(() => setEnviado(false), 3000);
    setData('');
    setMotivo('');
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground">Pedido de Folga</h1>

      {/* Formulário */}
      <div className="card-plantao space-y-4">
        <h2 className="font-bold text-foreground">Nova solicitação</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Data desejada</label>
            <Input type="date" value={data} onChange={e => setData(e.target.value)} required className="h-12 text-base" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Motivo</label>
            <Input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex: Consulta médica" required className="h-12 text-base" />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold gap-2">
            <Send size={18} /> Enviar solicitação
          </Button>
        </form>
        {enviado && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-success text-sm font-semibold text-center">
            Solicitação enviada com sucesso!
          </motion.p>
        )}
      </div>

      {/* Histórico */}
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
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusStyle[pedido.status]}`}>
              {statusLabel[pedido.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
