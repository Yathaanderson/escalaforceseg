import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate, formatTime, statusLabels, statusColors } from '@/lib/formatters';

export default function EmployeeSchedule() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const { data: escalas = [] } = useQuery({
    queryKey: ['minhas-escalas', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('escalas')
        .select('*, postos(nome_cliente, endereco), turnos(nome, hora_inicio, hora_fim)')
        .eq('funcionario_id', user!.id)
        .gte('data', today)
        .order('data');
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground">Minha Escala</h1>
      {escalas.length === 0 ? (
        <div className="card-plantao text-center py-8">
          <p className="text-lg font-semibold text-muted-foreground">Nenhum plantão agendado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {escalas.map((escala: any, i: number) => (
            <motion.div key={escala.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-plantao space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-foreground">{formatDate(escala.data)}</p>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[escala.status]}`}>
                  {statusLabels[escala.status]}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{escala.postos?.nome_cliente}</p>
                  <p className="text-xs text-muted-foreground">{escala.postos?.endereco}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-primary shrink-0" />
                <p className="text-sm font-semibold text-foreground">
                  {formatTime(escala.turnos?.hora_inicio || '')} – {formatTime(escala.turnos?.hora_fim || '')}
                </p>
                <span className="text-xs text-muted-foreground">({escala.turnos?.nome})</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
