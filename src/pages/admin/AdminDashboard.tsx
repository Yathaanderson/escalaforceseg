import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, MapPin, CalendarDays, FileText } from 'lucide-react';
import { formatTime } from '@/lib/formatters';

export default function AdminDashboard() {
  const today = new Date().toISOString().split('T')[0];

  const { data: funcionariosAtivos = 0 } = useQuery({
    queryKey: ['profiles-count'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('ativo', true);
      return count || 0;
    },
  });

  const { data: postosCount = 0 } = useQuery({
    queryKey: ['postos-count'],
    queryFn: async () => {
      const { count } = await supabase.from('postos').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: escalasHoje = [] } = useQuery({
    queryKey: ['escalas-hoje', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('escalas')
        .select('*, profiles!escalas_funcionario_id_fkey(nome), postos(nome_cliente), turnos(hora_inicio, hora_fim)')
        .eq('data', today);
      return data || [];
    },
  });

  const { data: folgasPendentes = [] } = useQuery({
    queryKey: ['folgas-pendentes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pedidos_folga')
        .select('*, profiles!pedidos_folga_funcionario_id_fkey(nome)')
        .eq('status', 'pendente');
      return data || [];
    },
  });

  const stats = [
    { label: 'Funcionários ativos', value: funcionariosAtivos, icon: Users, color: 'bg-primary text-primary-foreground' },
    { label: 'Postos cadastrados', value: postosCount, icon: MapPin, color: 'bg-info text-info-foreground' },
    { label: 'Escalas hoje', value: escalasHoje.length, icon: CalendarDays, color: 'bg-success text-success-foreground' },
    { label: 'Folgas pendentes', value: folgasPendentes.length, icon: FileText, color: 'bg-warning text-warning-foreground' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 border border-border shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-primary" /> Escalas de hoje
          </h3>
          <div className="space-y-2">
            {escalasHoje.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma escala hoje</p>
            ) : escalasHoje.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-semibold text-foreground text-sm">{e.profiles?.nome}</p>
                  <p className="text-xs text-muted-foreground">{e.postos?.nome_cliente}</p>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {formatTime(e.turnos?.hora_inicio || '')} – {formatTime(e.turnos?.hora_fim || '')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <FileText size={18} className="text-warning" /> Folgas pendentes
          </h3>
          <div className="space-y-2">
            {folgasPendentes.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma solicitação pendente</p>
            ) : folgasPendentes.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-semibold text-foreground text-sm">{p.profiles?.nome}</p>
                  <p className="text-xs text-muted-foreground">{p.motivo}</p>
                </div>
                <span className="bg-warning text-warning-foreground text-xs font-bold px-2 py-1 rounded-full">Pendente</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
