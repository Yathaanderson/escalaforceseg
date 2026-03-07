import { mockFuncionarios, mockPostos, mockEscalas, mockPedidosFolga, mockAvisos, getPosto, getTurno, getFuncionario } from '@/data/mockData';
import { Users, MapPin, CalendarDays, FileText, Megaphone, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const escalasHoje = mockEscalas.filter(e => e.data === today);
  const folgasPendentes = mockPedidosFolga.filter(p => p.status === 'pendente');
  const avisosAtivos = mockAvisos.filter(a => a.dataValidade >= today);
  const funcionariosAtivos = mockFuncionarios.filter(f => f.ativo);

  const stats = [
    { label: 'Funcionários ativos', value: funcionariosAtivos.length, icon: Users, color: 'bg-primary text-primary-foreground' },
    { label: 'Postos cadastrados', value: mockPostos.length, icon: MapPin, color: 'bg-info text-info-foreground' },
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
        {/* Escalas de hoje */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-primary" /> Escalas de hoje
          </h3>
          <div className="space-y-2">
            {escalasHoje.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma escala hoje</p>
            ) : escalasHoje.map(e => {
              const func = getFuncionario(e.funcionarioId);
              const posto = getPosto(e.postoId);
              const turno = getTurno(e.turnoId);
              return (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{func?.nome}</p>
                    <p className="text-xs text-muted-foreground">{posto?.nomeCliente}</p>
                  </div>
                  <p className="text-sm font-medium text-foreground">{turno?.horaInicio} – {turno?.horaFim}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Folgas pendentes */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning" /> Folgas pendentes
          </h3>
          <div className="space-y-2">
            {folgasPendentes.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma solicitação pendente</p>
            ) : folgasPendentes.map(p => {
              const func = getFuncionario(p.funcionarioId);
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{func?.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.motivo}</p>
                  </div>
                  <span className="bg-warning text-warning-foreground text-xs font-bold px-2 py-1 rounded-full">Pendente</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
