import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmployeeAnnouncements() {
  const today = new Date().toISOString().split('T')[0];

  const { data: avisos = [] } = useQuery({
    queryKey: ['avisos-ativos'],
    queryFn: async () => {
      const { data } = await supabase.from('avisos').select('*').gte('data_validade', today).order('created_at', { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground">Avisos</h1>
      {avisos.length === 0 ? (
        <div className="card-plantao text-center py-8">
          <p className="text-lg font-semibold text-muted-foreground">Nenhum aviso no momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {avisos.map((aviso, i) => (
            <motion.div key={aviso.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-plantao space-y-2">
              <div className="flex items-start gap-3">
                <Megaphone size={20} className="text-warning mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{aviso.titulo}</h3>
                  <p className="text-sm text-foreground mt-1">{aviso.texto}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <CalendarDays size={14} />
                    <span>Válido até {new Date(aviso.data_validade + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
