import { mockTurnos } from '@/data/mockData';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminShifts() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-11"><Plus size={18} /> Novo turno</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Turno</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); setDialogOpen(false); }}>
              <Input placeholder="Nome do turno (ex: Diurno)" className="h-11" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Início</label>
                  <Input type="time" className="h-11" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Fim</label>
                  <Input type="time" className="h-11" />
                </div>
              </div>
              <Button type="submit" className="w-full h-11">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockTurnos.map(t => (
          <div key={t.id} className="bg-card rounded-xl p-5 border border-border shadow-sm text-center">
            <Clock size={24} className="text-primary mx-auto mb-2" />
            <h3 className="font-bold text-foreground text-lg">{t.nome}</h3>
            <p className="text-xl font-semibold text-foreground mt-1">{t.horaInicio} – {t.horaFim}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
