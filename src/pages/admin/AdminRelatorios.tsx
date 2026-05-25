import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, FileSpreadsheet, Printer, CalendarDays, Users, MapPin, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { formatTime, statusLabels } from '@/lib/formatters';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBR(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
}

type ReportType = 'folha' | 'escala_posto' | 'escala_geral' | 'presenca' | 'financeiro';

export default function AdminRelatorios() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [reportType, setReportType] = useState<ReportType>('folha');
  const [selectedPostoId, setSelectedPostoId] = useState<string>('all');

  const monthDate = new Date(selectedMonth + '-01');
  const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');
  const mesLabel = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const { data: postos = [] } = useQuery({
    queryKey: ['postos'],
    queryFn: async () => {
      const { data } = await supabase.from('postos').select('*').order('nome_cliente');
      return data || [];
    },
  });

  const { data: turnos = [] } = useQuery({
    queryKey: ['turnos'],
    queryFn: async () => {
      const { data } = await supabase.from('turnos').select('*').order('hora_inicio');
      return data || [];
    },
  });

  const { data: funcionarios = [] } = useQuery({
    queryKey: ['profiles-relatorio'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('ativo', true).order('nome');
      return data || [];
    },
  });

  const { data: escalas = [] } = useQuery({
    queryKey: ['escalas-relatorio', monthStart, monthEnd],
    queryFn: async () => {
      const { data } = await supabase
        .from('escalas')
        .select('*, profiles!escalas_funcionario_id_fkey(nome, funcao), postos(nome_cliente, endereco), turnos(nome, hora_inicio, hora_fim)')
        .gte('data', monthStart)
        .lte('data', monthEnd)
        .order('data');
      return data || [];
    },
  });

  // Filter escalas by posto if selected
  const filteredEscalas = useMemo(() => {
    if (selectedPostoId === 'all') return escalas;
    return escalas.filter((e: any) => e.posto_id === selectedPostoId);
  }, [escalas, selectedPostoId]);

  // =============================================
  // REPORT DATA BUILDERS
  // =============================================

  const folhaData = useMemo(() => {
    return funcionarios.map((f: any) => {
      const funcEscalas = escalas.filter((e: any) => e.funcionario_id === f.id);
      const diasTrabalhados = funcEscalas.filter((e: any) => e.status !== 'falta').length;
      const faltas = funcEscalas.filter((e: any) => e.status === 'falta').length;
      const diaria = Number(f.valor_diaria) || 0;
      const salario = Number(f.salario_mensal) || 0;
      const valorExtra = Number(f.valor_extra) || 0;
      const totalDiarias = diaria * diasTrabalhados;
      const total = salario + totalDiarias + valorExtra;

      return {
        nome: f.nome,
        funcao: f.funcao || 'Vigilante',
        diaria,
        salario,
        valorExtra,
        diasTrabalhados,
        faltas,
        totalDiarias,
        total,
        dadosPagamento: f.dados_pagamento || '—',
      };
    });
  }, [funcionarios, escalas]);

  const escalaGeralData = useMemo(() => {
    return filteredEscalas.map((e: any) => ({
      data: formatDateBR(e.data),
      funcionario: e.profiles?.nome || '—',
      funcao: e.profiles?.funcao || '—',
      posto: e.postos?.nome_cliente || '—',
      turno: e.turnos?.nome || '—',
      horario: `${formatTime(e.turnos?.hora_inicio || '')} - ${formatTime(e.turnos?.hora_fim || '')}`,
      status: statusLabels[e.status as keyof typeof statusLabels] || e.status,
    }));
  }, [filteredEscalas]);

  const presencaData = useMemo(() => {
    return funcionarios.map((f: any) => {
      const funcEscalas = escalas.filter((e: any) => e.funcionario_id === f.id);
      const total = funcEscalas.length;
      const confirmados = funcEscalas.filter((e: any) => e.status === 'confirmado').length;
      const concluidos = funcEscalas.filter((e: any) => e.status === 'concluido').length;
      const faltas = funcEscalas.filter((e: any) => e.status === 'falta').length;
      const coberturas = funcEscalas.filter((e: any) => e.status === 'precisa_cobertura').length;
      const presencas = total - faltas;
      const taxaPresenca = total > 0 ? Math.round((presencas / total) * 100) : 100;

      return {
        nome: f.nome,
        funcao: f.funcao || 'Vigilante',
        totalEscalas: total,
        confirmados,
        concluidos,
        faltas,
        coberturas,
        presencas,
        taxaPresenca,
      };
    }).filter((f: any) => f.totalEscalas > 0);
  }, [funcionarios, escalas]);

  const financeiroData = useMemo(() => {
    const custoTotal = funcionarios.reduce((sum, f) => {
      const funcEscalas = escalas.filter((e: any) => e.funcionario_id === f.id);
      const diasTrabalhados = funcEscalas.filter((e: any) => e.status !== 'falta').length;
      const salario = Number((f as any).salario_mensal) || 0;
      const diaria = Number((f as any).valor_diaria) || 0;
      const extra = Number((f as any).valor_extra) || 0;
      return sum + salario + (diaria * diasTrabalhados) + extra;
    }, 0);

    const receitaTotal = postos.reduce((sum, p) => sum + (Number(p.valor_mensal) || 0), 0);
    const margem = receitaTotal - custoTotal;

    const porPosto = postos.map((p: any) => {
      const postoEscalas = escalas.filter((e: any) => e.posto_id === p.id);
      const uniqueFuncs = new Set(postoEscalas.map((e: any) => e.funcionario_id)).size;
      return {
        nome: p.nome_cliente,
        endereco: p.endereco,
        valorMensal: Number(p.valor_mensal) || 0,
        diaPgto: p.dia_pagamento || 1,
        escalas: postoEscalas.length,
        vigilantes: uniqueFuncs,
      };
    });

    return { custoTotal, receitaTotal, margem, porPosto };
  }, [funcionarios, escalas, postos]);

  // =============================================
  // EXPORT: PDF
  // =============================================

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(30, 30, 30);
    doc.text('EscalaPro - Relatório', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${reportTitles[reportType]} — ${mesLabel}`, pageWidth / 2, 22, { align: 'center' });
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 27, { align: 'center' });

    let startY = 35;

    if (reportType === 'folha') {
      autoTable(doc, {
        startY,
        head: [['Funcionário', 'Função', 'Dias Trab.', 'Faltas', 'Diária', 'Total Diárias', 'Salário', 'Extra', 'TOTAL', 'PIX/Conta']],
        body: folhaData.map(f => [
          f.nome, f.funcao, f.diasTrabalhados, f.faltas,
          formatBRL(f.diaria), formatBRL(f.totalDiarias), formatBRL(f.salario), formatBRL(f.valorExtra),
          formatBRL(f.total), f.dadosPagamento,
        ]),
        foot: [['TOTAL', '', folhaData.reduce((s, f) => s + f.diasTrabalhados, 0), folhaData.reduce((s, f) => s + f.faltas, 0),
          '', formatBRL(folhaData.reduce((s, f) => s + f.totalDiarias, 0)),
          formatBRL(folhaData.reduce((s, f) => s + f.salario, 0)),
          formatBRL(folhaData.reduce((s, f) => s + f.valorExtra, 0)),
          formatBRL(folhaData.reduce((s, f) => s + f.total, 0)), '']],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255 },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      });
    } else if (reportType === 'escala_geral') {
      autoTable(doc, {
        startY,
        head: [['Data', 'Funcionário', 'Função', 'Posto', 'Turno', 'Horário', 'Status']],
        body: escalaGeralData.map(e => [e.data, e.funcionario, e.funcao, e.posto, e.turno, e.horario, e.status]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      });
    } else if (reportType === 'presenca') {
      autoTable(doc, {
        startY,
        head: [['Funcionário', 'Função', 'Total Escalas', 'Confirmados', 'Concluídos', 'Faltas', 'Coberturas', 'Presenças', 'Taxa %']],
        body: presencaData.map(p => [p.nome, p.funcao, p.totalEscalas, p.confirmados, p.concluidos, p.faltas, p.coberturas, p.presencas, `${p.taxaPresenca}%`]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      });
    } else if (reportType === 'financeiro') {
      // Summary
      doc.setFontSize(12);
      doc.text(`Receita: ${formatBRL(financeiroData.receitaTotal)}`, 14, startY);
      doc.text(`Custo: ${formatBRL(financeiroData.custoTotal)}`, 14, startY + 7);
      doc.text(`Margem: ${formatBRL(financeiroData.margem)}`, 14, startY + 14);
      startY += 25;

      autoTable(doc, {
        startY,
        head: [['Posto', 'Endereço', 'Valor Mensal', 'Dia Pgto', 'Escalas', 'Vigilantes']],
        body: financeiroData.porPosto.map(p => [p.nome, p.endereco, formatBRL(p.valorMensal), `Dia ${p.diaPgto}`, p.escalas, p.vigilantes]),
        foot: [['TOTAL', '', formatBRL(financeiroData.receitaTotal), '', '', '']],
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255 },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      });
    } else if (reportType === 'escala_posto' && selectedPostoId !== 'all') {
      const posto = postos.find((p: any) => p.id === selectedPostoId);
      doc.setFontSize(12);
      doc.text(`Posto: ${posto?.nome_cliente || '—'}`, 14, startY);
      doc.text(`Endereço: ${posto?.endereco || '—'}`, 14, startY + 7);
      startY += 18;

      autoTable(doc, {
        startY,
        head: [['Data', 'Funcionário', 'Turno', 'Horário', 'Status']],
        body: escalaGeralData.map(e => [e.data, e.funcionario, e.turno, e.horario, e.status]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      });
    }

    doc.save(`relatorio_${reportType}_${selectedMonth}.pdf`);
  };

  // =============================================
  // EXPORT: EXCEL
  // =============================================

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (reportType === 'folha') {
      const wsData = [
        [`Relatório de Folha de Pagamento — ${mesLabel}`],
        [],
        ['Funcionário', 'Função', 'Dias Trab.', 'Faltas', 'Diária (R$)', 'Total Diárias (R$)', 'Salário (R$)', 'Extra (R$)', 'TOTAL (R$)', 'PIX/Conta'],
        ...folhaData.map(f => [f.nome, f.funcao, f.diasTrabalhados, f.faltas, f.diaria, f.totalDiarias, f.salario, f.valorExtra, f.total, f.dadosPagamento]),
        [],
        ['TOTAL', '', folhaData.reduce((s, f) => s + f.diasTrabalhados, 0), folhaData.reduce((s, f) => s + f.faltas, 0),
          '', folhaData.reduce((s, f) => s + f.totalDiarias, 0), folhaData.reduce((s, f) => s + f.salario, 0),
          folhaData.reduce((s, f) => s + f.valorExtra, 0), folhaData.reduce((s, f) => s + f.total, 0), ''],
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Folha de Pagamento');
    } else if (reportType === 'escala_geral') {
      const wsData = [
        [`Relatório de Escala Geral — ${mesLabel}`],
        [],
        ['Data', 'Funcionário', 'Função', 'Posto', 'Turno', 'Horário', 'Status'],
        ...escalaGeralData.map(e => [e.data, e.funcionario, e.funcao, e.posto, e.turno, e.horario, e.status]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Escala Geral');
    } else if (reportType === 'presenca') {
      const wsData = [
        [`Relatório de Presença — ${mesLabel}`],
        [],
        ['Funcionário', 'Função', 'Total Escalas', 'Confirmados', 'Concluídos', 'Faltas', 'Coberturas', 'Presenças', 'Taxa %'],
        ...presencaData.map(p => [p.nome, p.funcao, p.totalEscalas, p.confirmados, p.concluidos, p.faltas, p.coberturas, p.presencas, `${p.taxaPresenca}%`]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Presença');
    } else if (reportType === 'financeiro') {
      const wsData = [
        [`Relatório Financeiro — ${mesLabel}`],
        [],
        ['Resumo'],
        ['Receita Total', financeiroData.receitaTotal],
        ['Custo Total', financeiroData.custoTotal],
        ['Margem', financeiroData.margem],
        [],
        ['Posto', 'Endereço', 'Valor Mensal (R$)', 'Dia Pgto', 'Escalas', 'Vigilantes'],
        ...financeiroData.porPosto.map(p => [p.nome, p.endereco, p.valorMensal, p.diaPgto, p.escalas, p.vigilantes]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Financeiro');
    } else if (reportType === 'escala_posto' && selectedPostoId !== 'all') {
      const posto = postos.find((p: any) => p.id === selectedPostoId);
      const wsData = [
        [`Relatório de Escala por Posto — ${posto?.nome_cliente || ''} — ${mesLabel}`],
        [`Endereço: ${posto?.endereco || ''}`],
        [],
        ['Data', 'Funcionário', 'Turno', 'Horário', 'Status'],
        ...escalaGeralData.map(e => [e.data, e.funcionario, e.turno, e.horario, e.status]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Escala por Posto');
    }

    XLSX.writeFile(wb, `relatorio_${reportType}_${selectedMonth}.xlsx`);
  };

  // =============================================
  // REPORT CONFIG
  // =============================================

  const reportTitles: Record<ReportType, string> = {
    folha: 'Folha de Pagamento',
    escala_geral: 'Escala Geral do Mês',
    escala_posto: 'Escala por Posto',
    presenca: 'Controle de Presença',
    financeiro: 'Resumo Financeiro',
  };

  const reportIcons: Record<ReportType, any> = {
    folha: DollarSign,
    escala_geral: CalendarDays,
    escala_posto: MapPin,
    presenca: Users,
    financeiro: BarChart3,
  };

  const reportOptions: { value: ReportType; label: string; desc: string }[] = [
    { value: 'folha', label: 'Folha de Pagamento', desc: 'Salários, diárias, faltas e totais por funcionário' },
    { value: 'escala_geral', label: 'Escala Geral', desc: 'Todas as escalas do mês com detalhamento' },
    { value: 'escala_posto', label: 'Escala por Posto', desc: 'Escalas filtradas por posto de trabalho' },
    { value: 'presenca', label: 'Controle de Presença', desc: 'Taxa de presença, faltas e coberturas' },
    { value: 'financeiro', label: 'Resumo Financeiro', desc: 'Receita, custos e margem por posto' },
  ];

  const canExport = useMemo(() => {
    if (reportType === 'folha') return folhaData.length > 0;
    if (reportType === 'escala_geral') return escalaGeralData.length > 0;
    if (reportType === 'escala_posto') return selectedPostoId !== 'all' && escalaGeralData.length > 0;
    if (reportType === 'presenca') return presencaData.length > 0;
    if (reportType === 'financeiro') return postos.length > 0;
    return false;
  }, [reportType, folhaData, escalaGeralData, presencaData, postos, selectedPostoId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">Relatórios</h2>
        <p className="text-sm text-muted-foreground">Exporte relatórios em PDF ou Excel</p>
      </div>

      {/* Config panel */}
      <div className="bg-card rounded-xl p-5 border border-border shadow-sm space-y-4">
        {/* Report type */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Tipo de relatório</label>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportOptions.map(opt => {
              const Icon = reportIcons[opt.value];
              const active = reportType === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setReportType(opt.value)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    active
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className={active ? 'text-primary' : 'text-muted-foreground'} />
                    <span className={`text-sm font-semibold ${active ? 'text-primary' : 'text-foreground'}`}>{opt.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Month selector */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm font-semibold text-foreground mb-1 block">Mês</label>
            <InputMonth value={selectedMonth} onChange={setSelectedMonth} />
          </div>

          {reportType === 'escala_posto' && (
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Posto</label>
              <Select value={selectedPostoId} onValueChange={setSelectedPostoId}>
                <SelectTrigger className="h-11 w-[240px]"><SelectValue placeholder="Selecione o posto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os postos</SelectItem>
                  {postos.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome_cliente}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              className="gap-2 h-11"
              onClick={exportPDF}
              disabled={!canExport}
            >
              <FileDown size={18} /> Exportar PDF
            </Button>
            <Button
              className="gap-2 h-11"
              onClick={exportExcel}
              disabled={!canExport}
            >
              <FileSpreadsheet size={18} /> Exportar Excel
            </Button>
            <Button
              variant="ghost"
              className="gap-2 h-11"
              onClick={() => window.print()}
            >
              <Printer size={18} /> Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-muted/50 px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
            {(() => { const Icon = reportIcons[reportType]; return <Icon size={16} className="text-primary" />; })()}
            {reportTitles[reportType]} — {mesLabel}
          </h3>
          <span className="text-xs text-muted-foreground">
            {reportType === 'folha' && `${folhaData.length} funcionários`}
            {reportType === 'escala_geral' && `${escalaGeralData.length} escalas`}
            {reportType === 'escala_posto' && `${escalaGeralData.length} escalas`}
            {reportType === 'presenca' && `${presencaData.length} funcionários`}
            {reportType === 'financeiro' && `${postos.length} postos`}
          </span>
        </div>

        <div className="p-5 overflow-x-auto">
          {/* FOLHA DE PAGAMENTO */}
          {reportType === 'folha' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-2 py-2 font-semibold text-muted-foreground">Funcionário</th>
                  <th className="text-left px-2 py-2 font-semibold text-muted-foreground">Função</th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Dias</th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Faltas</th>
                  <th className="text-right px-2 py-2 font-semibold text-muted-foreground">Diária</th>
                  <th className="text-right px-2 py-2 font-semibold text-muted-foreground">Total Diárias</th>
                  <th className="text-right px-2 py-2 font-semibold text-muted-foreground">Salário</th>
                  <th className="text-right px-2 py-2 font-semibold text-muted-foreground">Extra</th>
                  <th className="text-right px-2 py-2 font-semibold text-muted-foreground">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {folhaData.map((f, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-2 py-2 font-medium text-foreground">{f.nome}</td>
                    <td className="px-2 py-2 text-muted-foreground">{f.funcao}</td>
                    <td className="px-2 py-2 text-center text-foreground">{f.diasTrabalhados}</td>
                    <td className="px-2 py-2 text-center text-destructive font-medium">{f.faltas}</td>
                    <td className="px-2 py-2 text-right text-foreground">{formatBRL(f.diaria)}</td>
                    <td className="px-2 py-2 text-right text-foreground">{formatBRL(f.totalDiarias)}</td>
                    <td className="px-2 py-2 text-right text-foreground">{formatBRL(f.salario)}</td>
                    <td className="px-2 py-2 text-right text-foreground">{formatBRL(f.valorExtra)}</td>
                    <td className="px-2 py-2 text-right font-bold text-foreground">{formatBRL(f.total)}</td>
                  </tr>
                ))}
                {folhaData.length > 0 && (
                  <tr className="bg-muted/50 font-bold">
                    <td className="px-2 py-2" colSpan={2}>TOTAL</td>
                    <td className="px-2 py-2 text-center">{folhaData.reduce((s, f) => s + f.diasTrabalhados, 0)}</td>
                    <td className="px-2 py-2 text-center text-destructive">{folhaData.reduce((s, f) => s + f.faltas, 0)}</td>
                    <td className="px-2 py-2" />
                    <td className="px-2 py-2 text-right">{formatBRL(folhaData.reduce((s, f) => s + f.totalDiarias, 0))}</td>
                    <td className="px-2 py-2 text-right">{formatBRL(folhaData.reduce((s, f) => s + f.salario, 0))}</td>
                    <td className="px-2 py-2 text-right">{formatBRL(folhaData.reduce((s, f) => s + f.valorExtra, 0))}</td>
                    <td className="px-2 py-2 text-right">{formatBRL(folhaData.reduce((s, f) => s + f.total, 0))}</td>
                  </tr>
                )}
                {folhaData.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum dado para este mês</td></tr>
                )}
              </tbody>
            </table>
          )}

          {/* ESCALA GERAL */}
          {reportType === 'escala_geral' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-2 py-2 font-semibold text-muted-foreground">Data</th>
                  <th className="text-left px-2 py-2 font-semibold text-muted-foreground">Funcionário</th>
                  <th className="text-left px-2 py-2 font-semibold text-muted-foreground">Posto</th>
                  <th className="text-left px-2 py-2 font-semibold text-muted-foreground">Turno</th>
                  <th className="text-left px-2 py-2 font-semibold text-muted-foreground">Horário</th>
                  <th className="text-left px-2 py-2 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {escalaGeralData.slice(0, 50).map((e, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-2 py-2 text-foreground">{e.data}</td>
                    <td className="px-2 py-2 font-medium text-foreground">{e.funcionario}</td>
                    <td className="px-2 py-2 text-foreground">{e.posto}</td>
                    <td className="px-2 py-2 text-muted-foreground">{e.turno}</td>
                    <td className="px-2 py-2 text-muted-foreground">{e.horario}</td>
                    <td className="px-2 py-2 text-foreground">{e.status}</td>
                  </tr>
                ))}
                {escalaGeralData.length > 50 && (
                  <tr><td colSpan={6} className="text-center py-3 text-muted-foreground text-xs">
                    Mostrando 50 de {escalaGeralData.length} registros. Exporte para ver todos.
                  </td></tr>
                )}
                {escalaGeralData.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma escala neste mês</td></tr>
                )}
              </tbody>
            </table>
          )}

          {/* PRESENCA */}
          {reportType === 'presenca' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-2 py-2 font-semibold text-muted-foreground">Funcionário</th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Escalas</th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Confirmados</th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Concluídos</th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Faltas</th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Coberturas</th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Presenças</th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {presencaData.map((p, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-2 py-2 font-medium text-foreground">{p.nome}</td>
                    <td className="px-2 py-2 text-center text-foreground">{p.totalEscalas}</td>
                    <td className="px-2 py-2 text-center text-success">{p.confirmados}</td>
                    <td className="px-2 py-2 text-center text-muted-foreground">{p.concluidos}</td>
                    <td className="px-2 py-2 text-center text-destructive font-medium">{p.faltas}</td>
                    <td className="px-2 py-2 text-center text-warning">{p.coberturas}</td>
                    <td className="px-2 py-2 text-center text-foreground">{p.presencas}</td>
                    <td className={`px-2 py-2 text-center font-bold ${p.taxaPresenca >= 90 ? 'text-success' : p.taxaPresenca >= 70 ? 'text-warning' : 'text-destructive'}`}>
                      {p.taxaPresenca}%
                    </td>
                  </tr>
                ))}
                {presencaData.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum dado de presença</td></tr>
                )}
              </tbody>
            </table>
          )}

          {/* FINANCEIRO */}
          {reportType === 'financeiro' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-success/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">Receita</p>
                  <p className="text-xl font-bold text-success">{formatBRL(financeiroData.receitaTotal)}</p>
                </div>
                <div className="bg-destructive/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">Custo</p>
                  <p className="text-xl font-bold text-destructive">{formatBRL(financeiroData.custoTotal)}</p>
                </div>
                <div className={`rounded-lg p-4 text-center ${financeiroData.margem >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  <p className="text-xs text-muted-foreground">Margem</p>
                  <p className={`text-xl font-bold ${financeiroData.margem >= 0 ? 'text-success' : 'text-destructive'}`}>{formatBRL(financeiroData.margem)}</p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-2 py-2 font-semibold text-muted-foreground">Posto</th>
                    <th className="text-left px-2 py-2 font-semibold text-muted-foreground">Endereço</th>
                    <th className="text-right px-2 py-2 font-semibold text-muted-foreground">Valor Mensal</th>
                    <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Dia Pgto</th>
                    <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Escalas</th>
                    <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Vigilantes</th>
                  </tr>
                </thead>
                <tbody>
                  {financeiroData.porPosto.map((p, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-2 py-2 font-medium text-foreground">{p.nome}</td>
                      <td className="px-2 py-2 text-muted-foreground">{p.endereco}</td>
                      <td className="px-2 py-2 text-right text-foreground">{formatBRL(p.valorMensal)}</td>
                      <td className="px-2 py-2 text-center text-foreground">Dia {p.diaPgto}</td>
                      <td className="px-2 py-2 text-center text-foreground">{p.escalas}</td>
                      <td className="px-2 py-2 text-center text-foreground">{p.vigilantes}</td>
                    </tr>
                  ))}
                  {financeiroData.porPosto.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum posto cadastrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ESCALA POR POSTO (same table as geral but filtered) */}
          {reportType === 'escala_posto' && selectedPostoId === 'all' && (
            <div className="text-center py-8">
              <MapPin size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Selecione um posto específico para gerar o relatório</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Month input component (type="month" workaround)
function InputMonth({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <input
        type="month"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-11 w-[200px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
