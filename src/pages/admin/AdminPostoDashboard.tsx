import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, CalendarDays, MapPin, Clock, AlertTriangle, DollarSign, ArrowLeft, CheckCircle2, XCircle, Shield, TrendingUp, UserCheck } from 'lucide-react';
import { formatTime, statusLabels, statusColors, formatDate } from '@/lib/formatters';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminPostoDashboard() {
  const { postoId } = useParams<{ postoId: string }>();
  const today = new Date().toISOString().split('T')[0];
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const { data: posto } = useQuery({
    queryKey: ['posto', postoId],
    queryFn: async () => {
      const { data } = await supabase.from('postos').select('*').eq('id', postoId).single();
      return data;
    },
    enabled: !!postoId,
  });

  const { data: escalasHoje = [] } = useQuery({
    queryKey: ['escalas-posto-hoje', postoId, today],
    queryFn: async () => {
      const { data } = await supabase
        .from('escalas')
        .select('*, profiles!escalas_funcionario_id_fkey(nome, funcao), turnos(nome, hora_inicio, hora_fim)')
        .eq('posto_id', postoId!)
        .eq('data', today);
      return data || [];
    },
    enabled: !!postoId,
  });

  const { data: escalasMes = [] } = useQuery({
    queryKey: ['escalas-posto-mes', postoId, monthStart, monthEnd],
    queryFn: async () => {
      const { data } = await supabase
        .from('escalas')
        .select('*, profiles!escalas_funcionario_id_fkey(nome, funcao), turnos(nome, hora_inicio, hora_fim)')
        .eq('posto_id', postoId!)
        .gte('data', monthStart)
        .lte('data', monthEnd)
        .order('data');
      return data || [];
    },
    enabled: !!postoId,
  });

  const { data: checkinsHoje = [] } = useQuery({
    queryKey: ['checkins-posto-hoje', postoId],
    queryFn: async () => {
      const escalaIds = escalasHoje.map((e: any) => e.id);
      if (escalaIds.length === 0) return [];
      const { data } = await supabase
        .from('checkins')
        .select('*')
        .in('escala_id', escalaIds);
      return data || [];
    },
    enabled: escalasHoje.length > 0,
  });

  if (!posto) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando posto...</p>
      </div>
    );
  }

  // Calculated stats
  const faltasMes = escalasMes.filter((e: any) => e.status === 'falta').length;
  const coberturasMes = escalasMes.filter((e: any) => e.status === 'precisa_cobertura').length;
  const confirmadosMes = escalasMes.filter((e: any) => e.status === 'confirmado').length;
  const concluidosMes = escalasMes.filter((e: any) => e.status === 'concluido').length;
  const totalEscalasMes = escalasMes.length;
  const taxaPresenca = totalEscalasMes > 0
    ? Math.round(((totalEscalasMes - faltasMes) / totalEscalasMes) * 100)
    : 100;

  // Unique funcionarios this month
  const funcionariosNoPosto = [...new Map(
    escalasMes.map((e: any) => [e.funcionario_id, e.profiles?.nome])
  ).entries()].map(([id, nome]) => ({ id, nome }));

  // Dias sem cobertura no mês
  const diasSemCobertura = escalasMes.filter((e: any) =>
    e.status === 'falta' || e.status === 'precisa_cobertura'
  );

  // Escalas por semana
  const escalasPorSemana: Record<number, number> = {};
  escalasMes.forEach((e: any) => {
    const date = new Date(e.data + 'T00:00:00');
    const weekNum = Math.ceil((date.getDate() + startOfMonth(new Date()).getDay()) / 7);
    escalasPorSemana[weekNum] = (escalasPorSemana[weekNum] || 0) + 1;
  });

  // Receita do posto
  const receitaMensal = Number(posto.valor_mensal) || 0;

  // Custo estimado: diária dos funcionários * dias trabalhados neste posto
  const { data: funcionariosDetalhe = [] } = useQuery({
    queryKey: ['funcionarios-posto-detalhe', postoId],
    queryFn: async () => {
      const funcIds = [...new Set(escalasMes.map((e: any) => e.funcionario_id))];
      if (funcIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, nome, valor_diaria, funcao')
        .in('id', funcIds);
      return data || [];
    },
    enabled: escalasMes.length > 0,
  });

  // Calculate custo: diária * numero de escalas por funcionario neste posto
  const custoEstimado = funcionariosDetalhe.reduce((sum, f) => {
    const diasNoPosto = escalasMes.filter((e: any) => e.funcionario_id === f.id).length;
    const diaria = Number((f as any).valor_diaria) || 0;
    return sum + (diaria * diasNoPosto);
  }, 0);
  const margemPosto = receitaMensal - custoEstimado;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/admin">
          <Button variant="outline" size="icon" className="mt-1">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <MapPin size={22} className="text-primary" />
            <h1 className="text-xl font-bold text-foreground">{posto.nome_cliente}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{posto.endereco}</p>
          {posto.tipo_servico && (
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-2 inline-block">
              {posto.tipo_servico}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-foreground">{formatBRL(receitaMensal)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
          <p className="text-xs text-muted-foreground">Pgto dia {posto.dia_pagamento || 1}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-primary/10">
            <CalendarDays size={20} className="text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalEscalasMes}</p>
          <p className="text-sm text-muted-foreground">Escalas no mês</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-success/10">
            <CheckCircle2 size={20} className="text-success" />
          </div>
          <p className="text-2xl font-bold text-foreground">{taxaPresenca}%</p>
          <p className="text-sm text-muted-foreground">Taxa presença</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-destructive/10">
            <XCircle size={20} className="text-destructive" />
          </div>
          <p className="text-2xl font-bold text-foreground">{faltasMes}</p>
          <p className="text-sm text-muted-foreground">Faltas no mês</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-info/10">
            <Users size={20} className="text-info" />
          </div>
          <p className="text-2xl font-bold text-foreground">{funcionariosNoPosto.length}</p>
          <p className="text-sm text-muted-foreground">Vigilantes alocados</p>
        </div>
      </div>

      {/* Financeiro do posto */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-success" />
            <span className="text-xs font-semibold text-muted-foreground">Receita</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatBRL(receitaMensal)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-destructive" />
            <span className="text-xs font-semibold text-muted-foreground">Custo estimado</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatBRL(custoEstimado)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className={margemPosto >= 0 ? 'text-success' : 'text-destructive'} />
            <span className="text-xs font-semibold text-muted-foreground">Margem</span>
          </div>
          <p className={`text-xl font-bold ${margemPosto >= 0 ? 'text-success' : 'text-destructive'}`}>{formatBRL(margemPosto)}</p>
        </div>
      </div>

      {/* Alerta de coberturas */}
      {coberturasMes > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-warning text-sm">{coberturasMes} coberturas pendentes neste posto</p>
            <p className="text-xs text-muted-foreground mt-1">Verifique as escalas com status "Precisa cobertura"</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Escalas de hoje */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Shield size={18} className="text-primary" /> Plantão de hoje
          </h3>
          {escalasHoje.length === 0 ? (
            <div className="text-center py-8 bg-destructive/5 rounded-lg border border-destructive/20">
              <AlertTriangle size={32} className="text-destructive mx-auto mb-2" />
              <p className="font-bold text-destructive">Posto descoberto!</p>
              <p className="text-sm text-muted-foreground mt-1">Nenhum vigilante escalado para hoje</p>
            </div>
          ) : (
            <div className="space-y-3">
              {escalasHoje.map((e: any) => {
                const checkinsEscala = checkinsHoje.filter((c: any) => c.escala_id === e.id);
                const fezCheckin = checkinsEscala.some((c: any) => c.tipo === 'checkin');
                const fezCheckout = checkinsEscala.some((c: any) => c.tipo === 'checkout');
                return (
                  <div key={e.id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground text-sm">{e.profiles?.nome}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[e.status as keyof typeof statusColors]}`}>
                        {statusLabels[e.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock size={14} />
                      <span>{formatTime(e.turnos?.hora_inicio || '')} – {formatTime(e.turnos?.hora_fim || '')}</span>
                      <span className="text-muted-foreground">({e.turnos?.nome})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {fezCheckin && (
                        <span className="flex items-center gap-1 text-success font-medium">
                          <CheckCircle2 size={12} /> Check-in {fezCheckout ? '✓ Check-out' : ''}
                        </span>
                      )}
                      {!fezCheckin && e.status !== 'falta' && (
                        <span className="text-muted-foreground">Aguardando check-in</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Vigilantes alocados */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <UserCheck size={18} className="text-primary" /> Vigilantes do posto — {mesAtual}
          </h3>
          {funcionariosNoPosto.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhum vigilante alocado</p>
          ) : (
            <div className="space-y-2">
              {funcionariosNoPosto.map((func: any) => {
                const diasTrabalhados = escalasMes.filter((e: any) => e.funcionario_id === func.id).length;
                const faltasDoFunc = escalasMes.filter((e: any) => e.funcionario_id === func.id && e.status === 'falta').length;
                return (
                  <div key={func.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-foreground text-sm">{func.nome}</p>
                      <p className="text-xs text-muted-foreground">{diasTrabalhados} dias alocados</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {faltasDoFunc > 0 && (
                        <span className="text-xs font-bold text-destructive">{faltasDoFunc} falta{faltasDoFunc > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Últimas escalas do mês */}
      <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <CalendarDays size={18} className="text-primary" /> Escalas do mês — {mesAtual}
        </h3>
        {escalasMes.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Nenhuma escala neste mês</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Data</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Vigilante</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground hidden sm:table-cell">Turno</th>
                  <th className="text-center px-3 py-2 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {escalasMes.map((e: any) => (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 text-foreground">{formatDate(e.data)}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{e.profiles?.nome}</td>
                    <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                      {e.turnos?.nome} ({formatTime(e.turnos?.hora_inicio || '')}–{formatTime(e.turnos?.hora_fim || '')})
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[e.status as keyof typeof statusColors]}`}>
                        {statusLabels[e.status as keyof typeof statusLabels]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Observações */}
      {posto.observacoes && (
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-bold text-foreground mb-2">Observações</h3>
          <p className="text-sm text-muted-foreground">{posto.observacoes}</p>
        </div>
      )}
    </div>
  );
}
