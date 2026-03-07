import { mockAvisos } from '@/data/mockData';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Megaphone, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminAnnouncements() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-11"><Plus size={18} /> Novo aviso</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Aviso</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); setDialogOpen(false); }}>
              <Input placeholder="Título do aviso" className="h-11" />
              <textarea
                placeholder="Texto do aviso"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Válido até</label>
                <Input type="date" className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11">Publicar aviso</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {mockAvisos.map(a => (
          <div key={a.id} className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Megaphone size={20} className="text-warning mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground">{a.titulo}</h3>
                  <p className="text-sm text-foreground mt-1">{a.texto}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Válido até {new Date(a.dataValidade + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0">
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
