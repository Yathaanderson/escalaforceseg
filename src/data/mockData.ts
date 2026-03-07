// Tipos e dados mock para o sistema de escala

export interface Funcionario {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  funcao: string;
  ativo: boolean;
}

export interface Posto {
  id: string;
  nomeCliente: string;
  endereco: string;
  tipoServico: string;
  observacoes: string;
}

export interface Turno {
  id: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
}

export type StatusEscala = 'planejado' | 'confirmado' | 'concluido' | 'falta' | 'precisa_cobertura';

export interface Escala {
  id: string;
  funcionarioId: string;
  postoId: string;
  turnoId: string;
  data: string; // YYYY-MM-DD
  status: StatusEscala;
}

export interface Checkin {
  id: string;
  escalaId: string;
  tipo: 'checkin' | 'checkout';
  dataHora: string;
  observacao?: string;
}

export interface PedidoFolga {
  id: string;
  funcionarioId: string;
  datas: string[];
  motivo: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  criadoEm: string;
}

export interface Aviso {
  id: string;
  titulo: string;
  texto: string;
  dataValidade: string;
  criadoEm: string;
}

export type UserRole = 'admin' | 'funcionario';

export interface User {
  id: string;
  nome: string;
  role: UserRole;
  funcionarioId?: string;
}

// --- MOCK DATA ---

export const mockFuncionarios: Funcionario[] = [
  { id: '1', nome: 'Carlos Silva', cpf: '123.456.789-00', telefone: '(11) 99999-1234', funcao: 'Vigilante', ativo: true },
  { id: '2', nome: 'Maria Santos', cpf: '987.654.321-00', telefone: '(11) 98888-5678', funcao: 'Vigilante', ativo: true },
  { id: '3', nome: 'José Oliveira', cpf: '456.789.123-00', telefone: '(11) 97777-9012', funcao: 'Vigilante Líder', ativo: true },
  { id: '4', nome: 'Ana Costa', cpf: '321.654.987-00', telefone: '(11) 96666-3456', funcao: 'Vigilante', ativo: false },
  { id: '5', nome: 'Pedro Almeida', cpf: '654.321.789-00', telefone: '(11) 95555-7890', funcao: 'Vigilante', ativo: true },
];

export const mockPostos: Posto[] = [
  { id: '1', nomeCliente: 'Condomínio Solar', endereco: 'Rua das Flores, 123 - Centro', tipoServico: 'Vigilância 24h', observacoes: 'Portaria principal' },
  { id: '2', nomeCliente: 'Shopping Plaza', endereco: 'Av. Brasil, 456 - Jardins', tipoServico: 'Ronda noturna', observacoes: 'Entrada pelo estacionamento' },
  { id: '3', nomeCliente: 'Banco Central', endereco: 'Rua Augusta, 789 - Centro', tipoServico: 'Vigilância armada', observacoes: 'Uso de colete obrigatório' },
];

export const mockTurnos: Turno[] = [
  { id: '1', nome: 'Diurno', horaInicio: '06:00', horaFim: '18:00' },
  { id: '2', nome: 'Noturno', horaInicio: '18:00', horaFim: '06:00' },
  { id: '3', nome: 'Manhã', horaInicio: '06:00', horaFim: '14:00' },
  { id: '4', nome: 'Tarde', horaInicio: '14:00', horaFim: '22:00' },
];

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];

export const mockEscalas: Escala[] = [
  { id: '1', funcionarioId: '1', postoId: '1', turnoId: '1', data: today, status: 'confirmado' },
  { id: '2', funcionarioId: '1', postoId: '2', turnoId: '2', data: tomorrow, status: 'planejado' },
  { id: '3', funcionarioId: '1', postoId: '1', turnoId: '1', data: dayAfter, status: 'planejado' },
  { id: '4', funcionarioId: '2', postoId: '3', turnoId: '1', data: today, status: 'confirmado' },
  { id: '5', funcionarioId: '3', postoId: '2', turnoId: '2', data: today, status: 'planejado' },
  { id: '6', funcionarioId: '5', postoId: '1', turnoId: '3', data: tomorrow, status: 'planejado' },
];

export const mockCheckins: Checkin[] = [
  { id: '1', escalaId: '1', tipo: 'checkin', dataHora: `${today}T06:02:00`, observacao: 'Chegada pontual' },
];

export const mockPedidosFolga: PedidoFolga[] = [
  { id: '1', funcionarioId: '1', datas: [dayAfter], motivo: 'Consulta médica', status: 'pendente', criadoEm: today },
  { id: '2', funcionarioId: '2', datas: [tomorrow, dayAfter], motivo: 'Motivos pessoais', status: 'pendente', criadoEm: today },
];

export const mockAvisos: Aviso[] = [
  { id: '1', titulo: 'Reunião mensal', texto: 'A reunião mensal será dia 15 às 10h na sede. Presença obrigatória.', dataValidade: '2026-03-30', criadoEm: '2026-03-01' },
  { id: '2', titulo: 'Novos uniformes', texto: 'Os novos uniformes estarão disponíveis para retirada a partir de segunda-feira na sede.', dataValidade: '2026-03-20', criadoEm: '2026-03-05' },
  { id: '3', titulo: 'Atualização de procedimento', texto: 'A partir de agora, todos os check-ins devem incluir foto do posto. Mais detalhes com o supervisor.', dataValidade: '2026-04-01', criadoEm: '2026-03-06' },
];

// Helper functions
export function getFuncionario(id: string) {
  return mockFuncionarios.find(f => f.id === id);
}

export function getPosto(id: string) {
  return mockPostos.find(p => p.id === id);
}

export function getTurno(id: string) {
  return mockTurnos.find(t => t.id === id);
}

export function getEscalasDoFuncionario(funcionarioId: string) {
  return mockEscalas.filter(e => e.funcionarioId === funcionarioId);
}

export function getEscalaDeHoje(funcionarioId: string) {
  return mockEscalas.find(e => e.funcionarioId === funcionarioId && e.data === today);
}

export function getProximasEscalas(funcionarioId: string) {
  return mockEscalas
    .filter(e => e.funcionarioId === funcionarioId && e.data >= today)
    .sort((a, b) => a.data.localeCompare(b.data));
}

export function getCheckinsDeEscala(escalaId: string) {
  return mockCheckins.filter(c => c.escalaId === escalaId);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

export const statusLabels: Record<StatusEscala, string> = {
  planejado: 'Planejado',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  falta: 'Falta',
  precisa_cobertura: 'Precisa cobertura',
};

export const statusColors: Record<StatusEscala, string> = {
  planejado: 'bg-info text-info-foreground',
  confirmado: 'bg-success text-success-foreground',
  concluido: 'bg-muted text-muted-foreground',
  falta: 'bg-destructive text-destructive-foreground',
  precisa_cobertura: 'bg-warning text-warning-foreground',
};
