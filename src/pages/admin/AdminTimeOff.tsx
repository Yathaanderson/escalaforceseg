import { mockPedidosFolga, getFuncionario, formatDate } from '@/data/mockData';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminTimeOff() {
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-foreground">Funcionário</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Datas</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground hidden sm:table-cell">Motivo</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {mockPedidosFolga.map(p => {
                const func = getFuncionario(p.funcionarioId);
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{func?.nome}</td>
                    <td className="px-4 py-3 text-foreground">{p.datas.map(d => formatDate(d)).join(', ')}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.motivo}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        p.status === 'pendente' ? 'bg-warning text-warning-foreground' :
                        p.status === 'aprovado' ? 'bg-success text-success-foreground' :
                        'bg-destructive text-destructive-foreground'
                      }`}>
                        {p.status === 'pendente' ? 'Pendente' : p.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.status === 'pendente' && (
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" variant="ghost" className="h-8 text-success hover:text-success">
                            <CheckCircle size={18} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive">
                            <XCircle size={18} />
                          </Button>
                        </div>
                      )}
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
