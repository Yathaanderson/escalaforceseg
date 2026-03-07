import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Clock, CheckCircle2, LogIn, LogOut, ChevronRight, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDate, formatDateLong, formatTime, statusLabels, statusColors } from '@/lib/formatters';
import { toast } from 'sonner';

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: escalaHoje } = useQuery({
    queryKey: ['escala-hoje', user?.id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from('escalas')
        .select('*, postos(nome_cliente, endereco), turnos(nome, hora_inicio, hora_fim)')
        .eq('funcionario_id', user!.id)
        .eq('data', today)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: checkins = [] } = useQuery({
    queryKey: ['checkins-hoje', escalaHoje?.id],
    queryFn: async () => {
      const { data } = await supabase.from('checkins').select('*').eq('escala_id', escalaHoje!.id);
      return data || [];
    },
    enabled: !!escalaHoje,
  });

  const { data: proximasEscalas = [] } = useQuery({
    queryKey: ['proximas-escalas', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('escalas')
        .select('*, postos(nome_cliente), turnos(hora_inicio, hora_fim)')
        .eq('funcionario_id', user!.id)
        .gte('data', today)
        .order('data')
        .limit(3);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: avisosAtivos = [] } = useQuery({
    queryKey: ['avisos-ativos'],
    queryFn: async () => {
      const { data } = await supabase.from('avisos').select('*').gte('data_validade', today).order('created_at', { ascending: false }).limit(2);
      return data || [];
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async (tipo: 'checkin' | 'checkout') => {
      const { error } = await supabase.from('checkins').insert({
        escala_id: escalaHoje!.id, tipo,
      });
      if (error) throw error;
    },
    onSuccess: (_, tipo) => {
      qc.invalidateQueries({ queryKey: ['checkins-hoje'] });
      toast.success(tipo === 'checkin' ? 'Check-in realizado!' : 'Check-out realizado!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const fezCheckin = checkins.some(c => c.tipo === 'checkin');
  const fezCheckout = checkins.some(c => c.tipo === 'checkout');

  const todayDate = new Date();
  const greeting = todayDate.getHours() < 12 ? 'Bom dia' : todayDate.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{greeting},</p>
          <h1 className="text-xl font-bold text-foreground">{user?.nome}</h1>
          <p className="text-sm text-muted-foreground">{formatDateLong(today)}</p>
        </div>
        <button onClick={logout} className="p-2 rounded-xl hover:bg-muted transition-colors" title="Sair">
          <LogOut size={22} className="text-muted-foreground" />
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {escalaHoje ? (
          <div className="card-plantao space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Plantão de hoje</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[escalaHoje.status]}`}>
                {statusLabels[escalaHoje.status]}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">{(escalaHoje as any).postos?.nome_cliente}</p>
                  <p className="text-sm text-muted-foreground">{(escalaHoje as any).postos?.endereco}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-primary shrink-0" />
                <p className="font-semibold text-foreground">
                  {formatTime((escalaHoje as any).turnos?.hora_inicio || '')} – {formatTime((escalaHoje as any).turnos?.hora_fim || '')}
                </p>
                <span className="text-sm text-muted-foreground">({(escalaHoje as any).turnos?.nome})</span>
              </div>
            </div>

            {!fezCheckin ? (
              <button onClick={() => checkinMutation.mutate('checkin')} className="btn-checkin flex items-center justify-center gap-3"
                disabled={checkinMutation.isPending}>
                <LogIn size={24} />
                {checkinMutation.isPending ? 'Registrando...' : 'Fazer Check-in'}
              </button>
            ) : !fezCheckout ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 size={20} />
                  <span className="text-sm font-semibold">Check-in realizado</span>
                </div>
                <button onClick={() => checkinMutation.mutate('checkout')} className="btn-checkout flex items-center justify-center gap-3"
                  disabled={checkinMutation.isPending}>
                  <LogOut size={24} />
                  {checkinMutation.isPending ? 'Registrando...' : 'Fazer Check-out'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-success bg-success/10 rounded-xl p-3">
                <CheckCircle2 size={20} />
                <span className="font-semibold">Plantão concluído!</span>
              </div>
            )}
          </div>
        ) : (
          <div className="card-plantao text-center py-8">
            <p className="text-lg font-semibold text-muted-foreground">Sem plantão hoje</p>
            <p className="text-sm text-muted-foreground mt-1">Aproveite seu descanso!</p>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Próximos plantões</h2>
          <Link to="/app/escala" className="text-sm text-primary font-semibold flex items-center gap-1">
            Ver todos <ChevronRight size={16} />
          </Link>
        </div>
        <div className="space-y-2">
          {proximasEscalas.map((escala: any) => (
            <div key={escala.id} className="card-plantao flex items-center gap-3 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{formatDate(escala.data)}</p>
                <p className="text-sm text-muted-foreground truncate">{escala.postos?.nome_cliente}</p>
              </div>
              <p className="text-sm font-semibold text-foreground shrink-0">
                {formatTime(escala.turnos?.hora_inicio || '')} – {formatTime(escala.turnos?.hora_fim || '')}
              </p>
            </div>
          ))}
          {proximasEscalas.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhum plantão agendado</p>
          )}
        </div>
      </motion.div>

      {avisosAtivos.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0">Avisos</h2>
            <Link to="/app/avisos" className="text-sm text-primary font-semibold flex items-center gap-1">
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-2">
            {avisosAtivos.map(aviso => (
              <div key={aviso.id} className="card-plantao py-3">
                <div className="flex items-start gap-3">
                  <Megaphone size={18} className="text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{aviso.titulo}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{aviso.texto}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
