import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, MapPin, CalendarDays, FileText, AlertTriangle, TrendingUp, UserX, Shield, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { formatTime, statusLabels, statusColors } from '@/lib/formatters';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const { data: funcionariosAtivos = 0 } = useQuery({
    queryKey: ['profiles-count'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('ativo', true);
      return count || 0;
    },
  });

  const { data: funcionariosInativos = 0 } = useQuery({
    queryKey: ['profiles-inativos-count'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('ativo', false);
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

  const { data: postos = [] } = useQuery({
    queryKey: ['postos'],
    queryFn: async () => {
      const { data } = await supabase.from('postos').select('*').order('nome_cliente');
      return data || [];
    },
  });

  const { data: escalasHoje = [] } = useQuery({
    queryKey: ['escalas-hoje', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('escalas')
        .select('*, profiles!escalas_funcionario_id_fkey(nome), postos(nome_cliente, endereco), turnos(nome, hora_inicio, hora_fim)')
        .eq('data', today);
      return data || [];
    },
  });

  const { data: escalasMes = [] } = useQuery({
    queryKey: ['escalas-mes-dashboard', monthStart, monthEnd],
    queryFn: async () => {
      const { data } = await supabase
        .from('escalas')
        .select('*, profiles!escalas_funcionario_id_fkey(nome), postos(nome_cliente), turnos(nome, hora_inicio, hora_fim)')
        .gte('data', monthStart)
        .lte('data', monthEnd);
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

  const { data: funcionarios = [] } = useQuery({
    queryKey: ['profiles-dashboard'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('ativo', true);
      return data || [];
    },
  });

  // Calculated stats
  const faltasMes = escalasMes.filter((e: any) => e.status === 'falta').length;
  const coberturasMes = escalasMes.filter((e: any) => e.status === 'precisa_cobertura').length;
  const confirmadosMes = escalasMes.filter((e: any) => e.status === 'confirmado').length;
  const totalEscalasMes = escalasMes.length;
  const taxaPresenca = totalEscalasMes > 0
    ? Math.round(((totalEscalasMes - faltasMes) / totalEscalasMes) * 100)
    : 100;

  // Uncovered postos today
  const postosHoje = new Set(escalasHoje.map((e: any) => e.posto_id));
  const postosDescobertos = postos.filter((p: any) => !postosHoje.has(p.id));

  // Financeiro quick calc
  const receitaTotal = postos.reduce((sum, p) => sum + (Number(p.valor_mensal) || 0), 0);
  const custoTotal = funcionarios.reduce((sum, f) => {
    const salario = Number((f as any).salario_mensal) || 0;
    const extra = Number((f as any).valor_extra) || 0;
    return sum + salario + extra;
  }, 0);
  const margem = receitaTotal - custoTotal;

  // Escalas por posto hoje
  const escalasPorPostoHoje = postos.map((posto: any) => {
    const escalasDoPosto = escalasHoje.filter((e: any) => e.posto_id === posto.id);
    return { posto, escalas: escalasDoPosto };
  });

  // Funcionários sem escala hoje
  const funcionariosComEscalaHoje = new Set(escalasHoje.map((e: any) => e.funcionario_id));
  const funcionariosSemEscala = funcionarios.filter((f: any) => !funcionariosComEscalaHoje.has(f.id));

  const stats = [
    { label: 'Funcionários ativos', value: funcionariosAtivos, icon: Users, color: 'bg-primary text-primary-foreground', sub: funcionariosInativos > 0 ? `${funcionariosInativos} inativos` : undefined },
    { label: 'Postos cadastrados', value: postosCount, icon: MapPin, color: 'bg-info text-info-foreground', sub: postosDescobertos.length > 0 ? `${postosDescobertos.length} sem escala hoje` : 'Todos cobertos' },
    { label: 'Escalas hoje', value: escalasHoje.length, icon: CalendarDays, color: 'bg-success text-success-foreground', sub: `${confirmadosMes} confirmados este mês` },
    { label: 'Folgas pendentes', value: folgasPendentes.length, icon: FileText, color: 'bg-warning text-warning-foreground' },
  ];

  return (
    <div className="space-y-6">
      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 border border-border shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
            {s.sub && <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Quick Financial Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">Receita Mensal</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatBRL(receitaTotal)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserX size={16} className="text-destructive" />
            <span className="text-xs font-semibold text-muted-foreground">Custo Mensal</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatBRL(custoTotal)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className={margem >= 0 ? 'text-success' : 'text-destructive'} />
            <span className="text-xs font-semibold text-muted-foreground">Margem</span>
          </div>
          <p className={`text-xl font-bold ${margem >= 0 ? 'text-success' : 'text-destructive'}`}>{formatBRL(margem)}</p>
        </div>
      </div>

      {/* Month Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-success/10">
            <CheckCircle2 size={20} className="text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taxa de presença</p>
            <p className={`text-lg font-bold ${taxaPresenca >= 90 ? 'text-success' : taxaPresenca >= 70 ? 'text-warning' : 'text-destructive'}`}>
              {taxaPresenca}%
            </p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-destructive/10">
            <XCircle size={20} className="text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Faltas no mês</p>
            <p className="text-lg font-bold text-foreground">{faltasMes}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-warning/10">
            <AlertTriangle size={20} className="text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Coberturas pendentes</p>
            <p className="text-lg font-bold text-foreground">{coberturasMes}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <CalendarDays size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Escalas no mês</p>
            <p className="text-lg font-bold text-foreground">{totalEscalasMes}</p>
          </div>
        </div>
      </div>

      {/* Alert: Uncovered postos */}
      {postosDescobertos.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-destructive text-sm">Postos sem vigilante hoje!</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {postosDescobertos.map((p: any) => (
                <Link key={p.id} to={`/admin/posto/${p.id}`}>
                  <span className="text-xs font-semibold bg-destructive text-destructive-foreground px-2 py-1 rounded-full hover:opacity-80 transition-opacity">
                    {p.nome_cliente}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Escalas de Hoje por Posto */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <CalendarDays size={18} className="text-primary" /> Escalas de hoje
            </h3>
            <Link to="/admin/escala">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Ver escala <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {escalasPorPostoHoje.map(({ posto, escalas: escalasDoPosto }: any) => (
              <div key={posto.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Link to={`/admin/posto/${posto.id}`} className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                    {posto.nome_cliente}
                  </Link>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${escalasDoPosto.length > 0 ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                    {escalasDoPosto.length > 0 ? `${escalasDoPosto.length} vigilante${escalasDoPosto.length > 1 ? 's' : ''}` : 'Descoberto'}
                  </span>
                </div>
                {escalasDoPosto.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between py-1.5 pl-3 border-l-2 border-primary/30">
                    <div>
                      <p className="font-medium text-foreground text-sm">{e.profiles?.nome}</p>
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {formatTime(e.turnos?.hora_inicio || '')} – {formatTime(e.turnos?.hora_fim || '')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[e.status as keyof typeof statusColors]}`}>
                      {statusLabels[e.status as keyof typeof statusLabels]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            {escalasHoje.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma escala hoje</p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Funcionários sem escala hoje */}
          {funcionariosSemEscala.length > 0 && (
            <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Users size={18} className="text-muted-foreground" /> Disponíveis hoje ({funcionariosSemEscala.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {funcionariosSemEscala.map((f: any) => (
                  <span key={f.id} className="text-xs font-medium bg-muted px-2.5 py-1 rounded-full text-foreground">
                    {f.nome}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Folgas pendentes */}
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

          {/* Resumo por posto — mini cards */}
          <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <MapPin size={18} className="text-primary" /> Postos — {mesAtual}
              </h3>
              <Link to="/admin/postos">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Ver todos <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {postos.map((p: any) => {
                const escalasDoPostoMes = escalasMes.filter((e: any) => e.posto_id === p.id);
                const uniqueFuncionarios = new Set(escalasDoPostoMes.map((e: any) => e.funcionario_id)).size;
                return (
                  <Link key={p.id} to={`/admin/posto/${p.id}`} className="block">
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                      <div>
                        <p className="font-medium text-foreground text-sm">{p.nome_cliente}</p>
                        <p className="text-xs text-muted-foreground">{escalasDoPostoMes.length} escalas · {uniqueFuncionarios} vigilantes</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground text-sm">{formatBRL(Number(p.valor_mensal) || 0)}</p>
                        <p className="text-xs text-muted-foreground">Dia {p.dia_pagamento || 1}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {postos.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">Nenhum posto cadastrado</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
