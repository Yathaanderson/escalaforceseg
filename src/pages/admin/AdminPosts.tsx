import { mockPostos } from '@/data/mockData';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminPosts() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-11"><Plus size={18} /> Novo posto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Posto</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); setDialogOpen(false); }}>
              <Input placeholder="Nome do cliente" className="h-11" />
              <Input placeholder="Endereço" className="h-11" />
              <Input placeholder="Tipo de serviço" className="h-11" />
              <Input placeholder="Observações" className="h-11" />
              <Button type="submit" className="w-full h-11">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockPostos.map(p => (
          <div key={p.id} className="bg-card rounded-xl p-5 border border-border shadow-sm space-y-2">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">{p.nomeCliente}</h3>
                <p className="text-sm text-muted-foreground">{p.endereco}</p>
              </div>
            </div>
            <div className="bg-muted rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground">Serviço</p>
              <p className="text-sm font-medium text-foreground">{p.tipoServico}</p>
            </div>
            {p.observacoes && (
              <p className="text-xs text-muted-foreground">{p.observacoes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
