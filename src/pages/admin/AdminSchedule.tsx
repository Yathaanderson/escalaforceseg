import { mockEscalas, mockFuncionarios, mockPostos, mockTurnos, formatDate, statusLabels, statusColors, getFuncionario, getPosto, getTurno } from '@/data/mockData';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function AdminSchedule() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-11"><Plus size={18} /> Nova escala</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Escala</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); setDialogOpen(false); }}>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Funcionário</label>
                <Select>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {mockFuncionarios.filter(f => f.ativo).map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Posto</label>
                <Select>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {mockPostos.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nomeCliente}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Turno</label>
                <Select>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {mockTurnos.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.nome} ({t.horaInicio}–{t.horaFim})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Data</label>
                <Input type="date" className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11">Criar escala</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-foreground">Data</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Funcionário</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground hidden sm:table-cell">Posto</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground hidden md:table-cell">Turno</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockEscalas.sort((a, b) => a.data.localeCompare(b.data)).map(e => {
                const func = getFuncionario(e.funcionarioId);
                const posto = getPosto(e.postoId);
                const turno = getTurno(e.turnoId);
                return (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{formatDate(e.data)}</td>
                    <td className="px-4 py-3 text-foreground">{func?.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{posto?.nomeCliente}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{turno?.horaInicio} – {turno?.horaFim}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[e.status]}`}>
                        {statusLabels[e.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
