import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, UserCheck, UserX, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminEmployees() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [funcao, setFuncao] = useState('Vigilante');
  const [dadosPagamento, setDadosPagamento] = useState('');
  const qc = useQueryClient();

  const { data: funcionarios = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('nome');
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setNome(''); setEmail(''); setCpf(''); setTelefone(''); setFuncao('Vigilante'); setDadosPagamento('');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: '123456',
        options: { data: { nome } },
      });
      if (authError) throw authError;
      if (authData.user) {
        await supabase.from('profiles').update({ cpf, telefone, funcao, dados_pagamento: dadosPagamento || null }).eq('id', authData.user.id);
        await supabase.from('user_roles').insert({ user_id: authData.user.id, role: 'funcionario' });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      setDialogOpen(false); resetForm();
      toast.success('Funcionário criado com sucesso');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase.from('profiles').update({ nome, cpf, telefone, funcao }).eq('id', editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      setDialogOpen(false); resetForm();
      toast.success('Funcionário atualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('profiles').update({ ativo: !ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Status atualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleEdit = (f: any) => {
    setEditingId(f.id);
    setNome(f.nome);
    setEmail('');
    setCpf(f.cpf || '');
    setTelefone(f.telefone || '');
    setFuncao(f.funcao || 'Vigilante');
    setDialogOpen(true);
  };

  const filtered = funcionarios.filter(f =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    (f.funcao || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar funcionário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-11" onClick={() => resetForm()}><Plus size={18} /> Novo funcionário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); editingId ? updateMutation.mutate() : createMutation.mutate(); }}>
              <Input placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} className="h-11" required />
              {!editingId && (
                <Input placeholder="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11" required />
              )}
              <Input placeholder="CPF" value={cpf} onChange={e => setCpf(e.target.value)} className="h-11" />
              <Input placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} className="h-11" />
              <Input placeholder="Função (ex: Vigilante)" value={funcao} onChange={e => setFuncao(e.target.value)} className="h-11" />
              <Button type="submit" className="w-full h-11" disabled={editingId ? updateMutation.isPending : createMutation.isPending}>
                {editingId ? (updateMutation.isPending ? 'Salvando...' : 'Salvar alterações') : (createMutation.isPending ? 'Salvando...' : 'Salvar')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-foreground">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground hidden sm:table-cell">CPF</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground hidden md:table-cell">Telefone</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Função</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{f.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{f.cpf || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{f.telefone || '—'}</td>
                  <td className="px-4 py-3 text-foreground">{f.funcao || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleAtivoMutation.mutate({ id: f.id, ativo: f.ativo })} className="cursor-pointer">
                      {f.ativo ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-success"><UserCheck size={14} /> Ativo</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive"><UserX size={14} /> Inativo</span>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(f)}>
                        <Pencil size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
