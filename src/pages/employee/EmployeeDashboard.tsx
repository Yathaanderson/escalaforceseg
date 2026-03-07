import { useAuth } from '@/contexts/AuthContext';
import { 
  getEscalaDeHoje, getProximasEscalas, getPosto, getTurno, 
  getCheckinsDeEscala, mockAvisos, formatDate, formatDateLong,
  statusLabels, statusColors
} from '@/data/mockData';
import { MapPin, Clock, CheckCircle2, LogIn, LogOut, ChevronRight, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const funcionarioId = user?.funcionarioId || '1';

  const escalaHoje = getEscalaDeHoje(funcionarioId);
  const proximasEscalas = getProximasEscalas(funcionarioId);
  const checkins = escalaHoje ? getCheckinsDeEscala(escalaHoje.id) : [];
  const posto = escalaHoje ? getPosto(escalaHoje.postoId) : null;
  const turno = escalaHoje ? getTurno(escalaHoje.turnoId) : null;

  const fezCheckin = checkins.some(c => c.tipo === 'checkin');
  const fezCheckout = checkins.some(c => c.tipo === 'checkout');

  const [checkinDone, setCheckinDone] = useState(fezCheckin);
  const [checkoutDone, setCheckoutDone] = useState(fezCheckout);

  const avisosAtivos = mockAvisos.filter(a => a.dataValidade >= new Date().toISOString().split('T')[0]);

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Bom dia' : today.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{greeting},</p>
          <h1 className="text-xl font-bold text-foreground">{user?.nome}</h1>
          <p className="text-sm text-muted-foreground">{formatDateLong(today.toISOString().split('T')[0])}</p>
        </div>
        <button onClick={logout} className="p-2 rounded-xl hover:bg-muted transition-colors" title="Sair">
          <LogOut size={22} className="text-muted-foreground" />
        </button>
      </div>

      {/* Plantão de hoje */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {escalaHoje && posto && turno ? (
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
                  <p className="font-semibold text-foreground">{posto.nomeCliente}</p>
                  <p className="text-sm text-muted-foreground">{posto.endereco}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-primary shrink-0" />
                <p className="font-semibold text-foreground">{turno.horaInicio} – {turno.horaFim}</p>
                <span className="text-sm text-muted-foreground">({turno.nome})</span>
              </div>
            </div>

            {/* Check-in/Check-out */}
            {!checkinDone ? (
              <button
                onClick={() => setCheckinDone(true)}
                className="btn-checkin flex items-center justify-center gap-3"
              >
                <LogIn size={24} />
                Fazer Check-in
              </button>
            ) : !checkoutDone ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 size={20} />
                  <span className="text-sm font-semibold">Check-in realizado</span>
                </div>
                <button
                  onClick={() => setCheckoutDone(true)}
                  className="btn-checkout flex items-center justify-center gap-3"
                >
                  <LogOut size={24} />
                  Fazer Check-out
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

      {/* Próximos plantões */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Próximos plantões</h2>
          <Link to="/app/escala" className="text-sm text-primary font-semibold flex items-center gap-1">
            Ver todos <ChevronRight size={16} />
          </Link>
        </div>
        <div className="space-y-2">
          {proximasEscalas.slice(0, 3).map(escala => {
            const p = getPosto(escala.postoId);
            const t = getTurno(escala.turnoId);
            return (
              <div key={escala.id} className="card-plantao flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{formatDate(escala.data)}</p>
                  <p className="text-sm text-muted-foreground truncate">{p?.nomeCliente}</p>
                </div>
                <p className="text-sm font-semibold text-foreground shrink-0">{t?.horaInicio} – {t?.horaFim}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Avisos */}
      {avisosAtivos.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0">Avisos</h2>
            <Link to="/app/avisos" className="text-sm text-primary font-semibold flex items-center gap-1">
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-2">
            {avisosAtivos.slice(0, 2).map(aviso => (
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
