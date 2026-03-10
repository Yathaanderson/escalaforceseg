import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Users, TrendingUp, TrendingDown, Building2 } from 'lucide-react';

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminFinanceiro() {
  const { data: postos = [] } = useQuery({
    queryKey: ['postos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('postos').select('*').order('nome_cliente');
      if (error) throw error;
      return data;
    },
  });

  const { data: funcionarios = [] } = useQuery({
    queryKey: ['profiles-financeiro'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('ativo', true).order('nome');
      if (error) throw error;
      return data;
    },
  });

  const now = new Date();
  const mesAtual = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const { data: escalasCount = 0 } = useQuery({
    queryKey: ['escalas-count-month', now.getMonth()],
    queryFn: async () => {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const { count, error } = await supabase.from('escalas').select('*', { count: 'exact', head: true })
        .gte('data', start).lte('data', end);
      if (error) throw error;
      return count || 0;
    },
  });

  const receitaTotal = postos.reduce((sum, p) => sum + (Number(p.valor_mensal) || 0), 0);
  const custoTotal = funcionarios.reduce((sum, f) => {
    const salario = Number((f as any).salario_mensal) || 0;
    const extra = Number((f as any).valor_extra) || 0;
    return sum + salario + extra;
  }, 0);
  const margem = receitaTotal - custoTotal;
  const totalFuncionarios = funcionarios.length;
  const totalPostos = postos.length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <DollarSign size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita Mensal</p>
              <p className="text-lg font-bold text-foreground">{formatBRL(receitaTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-destructive/10">
              <TrendingDown size={22} className="text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custo Mensal</p>
              <p className="text-lg font-bold text-foreground">{formatBRL(custoTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${margem >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <TrendingUp size={22} className={margem >= 0 ? 'text-success' : 'text-destructive'} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margem</p>
              <p className={`text-lg font-bold ${margem >= 0 ? 'text-success' : 'text-destructive'}`}>{formatBRL(margem)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Building2 size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Postos Ativos</p>
              <p className="text-lg font-bold text-foreground">{totalPostos}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Users size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Funcionários</p>
              <p className="text-lg font-bold text-foreground">{totalFuncionarios}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign size={18} className="text-primary" />
            Receitas por Posto — {mesAtual}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead className="text-right">Valor Mensal</TableHead>
                <TableHead className="text-center">Dia Pgto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {postos.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome_cliente}</TableCell>
                  <TableCell className="text-muted-foreground">{p.endereco}</TableCell>
                  <TableCell className="text-right font-semibold">{formatBRL(Number(p.valor_mensal) || 0)}</TableCell>
                  <TableCell className="text-center">{p.dia_pagamento || 1}</TableCell>
                </TableRow>
              ))}
              {postos.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">{formatBRL(receitaTotal)}</TableCell>
                  <TableCell />
                </TableRow>
              )}
              {postos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum posto cadastrado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employee costs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users size={18} className="text-primary" />
            Custos com Funcionários — {mesAtual}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Diária</TableHead>
                <TableHead className="text-right">Salário</TableHead>
                <TableHead className="text-right">Extra</TableHead>
                <TableHead>Conta / PIX</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funcionarios.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{f.funcao || '—'}</TableCell>
                  <TableCell className="text-right">{formatBRL(Number((f as any).valor_diaria) || 0)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatBRL(Number((f as any).salario_mensal) || 0)}</TableCell>
                  <TableCell className="text-right">{formatBRL(Number((f as any).valor_extra) || 0)}</TableCell>
                  <TableCell>{f.dados_pagamento || <span className="text-muted-foreground italic">Não informado</span>}</TableCell>
                </TableRow>
              ))}
              {funcionarios.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">{formatBRL(funcionarios.reduce((s, f) => s + (Number((f as any).valor_diaria) || 0), 0))}</TableCell>
                  <TableCell className="text-right">{formatBRL(funcionarios.reduce((s, f) => s + (Number((f as any).salario_mensal) || 0), 0))}</TableCell>
                  <TableCell className="text-right">{formatBRL(funcionarios.reduce((s, f) => s + (Number((f as any).valor_extra) || 0), 0))}</TableCell>
                  <TableCell />
                </TableRow>
              )}
              {funcionarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum funcionário ativo</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}