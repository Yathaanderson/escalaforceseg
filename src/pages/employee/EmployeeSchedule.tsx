import { useAuth } from '@/contexts/AuthContext';
import { getProximasEscalas, getPosto, getTurno, formatDate, formatDateLong, statusLabels, statusColors } from '@/data/mockData';
import { MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmployeeSchedule() {
  const { user } = useAuth();
  const funcionarioId = user?.funcionarioId || '1';
  const escalas = getProximasEscalas(funcionarioId);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground">Minha Escala</h1>

      {escalas.length === 0 ? (
        <div className="card-plantao text-center py-8">
          <p className="text-lg font-semibold text-muted-foreground">Nenhum plantão agendado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {escalas.map((escala, i) => {
            const posto = getPosto(escala.postoId);
            const turno = getTurno(escala.turnoId);
            return (
              <motion.div
                key={escala.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-plantao space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-foreground">{formatDate(escala.data)}</p>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[escala.status]}`}>
                    {statusLabels[escala.status]}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{posto?.nomeCliente}</p>
                    <p className="text-xs text-muted-foreground">{posto?.endereco}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-primary shrink-0" />
                  <p className="text-sm font-semibold text-foreground">{turno?.horaInicio} – {turno?.horaFim}</p>
                  <span className="text-xs text-muted-foreground">({turno?.nome})</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
