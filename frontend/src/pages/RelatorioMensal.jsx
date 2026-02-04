import { useState, useEffect, useMemo } from 'react';
import { relatorioAPI, medicoesAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useToast } from '../hooks/useToast';
import Toast from '../components/ui/Toast';

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const getStatusBadge = (status) => {
  switch (status) {
    case 'ok':
      return 'badge-success';
    case 'pendente':
      return 'badge-warning';
    case 'atrasada':
      return 'badge-error';
    case 'nao_aplicavel':
      return 'badge-ghost';
    default:
      return 'badge-ghost';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'ok':
      return 'OK';
    case 'pendente':
      return 'PEND';
    case 'atrasada':
      return 'ATR';
    case 'nao_aplicavel':
      return 'N/A';
    default:
      return '-';
  }
};

export default function RelatorioMensal() {
  const [relatorio, setRelatorio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [expandedFornecedores, setExpandedFornecedores] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedSequencias, setSelectedSequencias] = useState(new Set());

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadRelatorio();
  }, [anoAtual]);

  const loadRelatorio = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await relatorioAPI.getTabela(anoAtual);
      const tabela = response.data || [];
      setRelatorio(tabela);

      const fornecedorIds = new Set(tabela.map(row => row.fornecedorId?._id || row.fornecedorId));
      setExpandedFornecedores(fornecedorIds);
    } catch (err) {
      console.error('Erro ao carregar relatório:', err);
      setError('Erro ao carregar dados do relatório');
      showToast('Erro ao carregar relatório', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (direction) => {
    setAnoAtual(prev => prev + direction);
  };

  const toggleFornecedor = (fornecedorId) => {
    setExpandedFornecedores(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fornecedorId)) {
        newSet.delete(fornecedorId);
      } else {
        newSet.add(fornecedorId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const ids = new Set(relatorio.map(row => row.fornecedorId?._id || row.fornecedorId));
    setExpandedFornecedores(ids);
  };

  const collapseAll = () => {
    setExpandedFornecedores(new Set());
  };

  const toggleSequencia = (sequenciaId) => {
    setSelectedSequencias(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sequenciaId)) {
        newSet.delete(sequenciaId);
      } else {
        newSet.add(sequenciaId);
      }
      return newSet;
    });
  };

  const toggleAllSequencias = () => {
    if (selectedSequencias.size === relatorio.length) {
      setSelectedSequencias(new Set());
    } else {
      setSelectedSequencias(new Set(relatorio.map(row => row.sequenciaId)));
    }
  };

  const sincronizarSelecionadas = async () => {
    if (selectedSequencias.size === 0) {
      showToast('Selecione ao menos uma sequência', 'warning');
      return;
    }

    try {
      setSyncing(true);
      const promises = Array.from(selectedSequencias).map(id =>
        medicoesAPI.sincronizar(id)
      );
      await Promise.all(promises);
      showToast(`${selectedSequencias.size} sequência(s) sincronizada(s) com sucesso`, 'success');
      setSelectedSequencias(new Set());
      loadRelatorio();
    } catch (err) {
      console.error('Erro ao sincronizar:', err);
      showToast('Erro ao sincronizar sequências', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const sincronizarTodas = async () => {
    try {
      setSyncing(true);
      await medicoesAPI.sincronizarTodas();
      showToast('Todas as sequências sincronizadas com sucesso', 'success');
      setSelectedSequencias(new Set());
      loadRelatorio();
    } catch (err) {
      console.error('Erro ao sincronizar:', err);
      showToast('Erro ao sincronizar todas as sequências', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Agrupar dados por fornecedor > contrato
  const dadosAgrupados = useMemo(() => {
    const fornecedoresMap = new Map();

    relatorio.forEach(row => {
      const fornecedorId = row.fornecedorId?._id || row.fornecedorId;
      const contratoId = row.contratoId?._id || row.contratoId;

      if (!fornecedoresMap.has(fornecedorId)) {
        fornecedoresMap.set(fornecedorId, {
          _id: fornecedorId,
          nome: row.fornecedor,
          contratos: new Map()
        });
      }

      const fornecedor = fornecedoresMap.get(fornecedorId);
      if (!fornecedor.contratos.has(contratoId)) {
        fornecedor.contratos.set(contratoId, {
          _id: contratoId,
          numero: row.contrato,
          medicoes: []
        });
      }

      const contrato = fornecedor.contratos.get(contratoId);
      contrato.medicoes.push({
        _id: row.sequenciaId,
        sequencia: row.sequencia,
        estabelecimento: row.estabelecimento,
        recebimento: row.recebimento,
        custo: row.custo || row.valor,
        dataEmissao: row.dataEmissao || row.diaEmissao,
        dataMedicao: row.datMedicao || row.dataMedicao,
        responsavel: row.responsavel,
        numeroNota: row.numeroNota,
        statusMensal: row.statusMensal || {}
      });
    });

    return Array.from(fornecedoresMap.values()).map(f => ({
      ...f,
      contratos: Array.from(f.contratos.values())
    }));
  }, [relatorio]);

  // Estatísticas
  const stats = useMemo(() => {
    const mesAtual = `${anoAtual}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    let total = 0, ok = 0, pendente = 0, atrasada = 0;

    relatorio.forEach(row => {
      total++;
      const status = row.statusMensal?.[mesAtual];
      if (status === 'ok') ok++;
      else if (status === 'pendente') pendente++;
      else if (status === 'atrasada') atrasada++;
    });

    return { total, ok, pendente, atrasada };
  }, [relatorio, anoAtual]);

  // Total de fornecedores únicos
  const totalFornecedores = useMemo(() => {
    return dadosAgrupados.length;
  }, [dadosAgrupados]);

  // Filtrar dados
  const dadosFiltrados = useMemo(() => {
    if (!filterStatus) return dadosAgrupados;

    const mesAtual = `${anoAtual}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    return dadosAgrupados.map(f => ({
      ...f,
      contratos: f.contratos.map(c => ({
        ...c,
        medicoes: c.medicoes.filter(m => m.statusMensal?.[mesAtual] === filterStatus)
      })).filter(c => c.medicoes.length > 0)
    })).filter(f => f.contratos.length > 0);
  }, [dadosAgrupados, filterStatus, anoAtual]);

  // Obter status de um mês específico
  const getStatusMes = (statusMensal, mesIndex) => {
    const monthKey = `${anoAtual}-${String(mesIndex + 1).padStart(2, '0')}`;
    return statusMensal?.[monthKey] || null;
  };

  // Mês atual destacado
  const mesAtualIndex = new Date().getMonth();

  // ── Loading: Skeleton UI ──
  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <Toast {...toast} onClose={hideToast} />

        {/* Skeleton Header */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-3 w-24 bg-base-300/50 rounded-full animate-pulse mb-3" />
              <div className="h-7 w-56 bg-base-300/50 rounded-full animate-pulse mb-2" />
              <div className="h-4 w-44 bg-base-300/50 rounded-full animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-base-300/40 rounded-lg animate-pulse" />
              <div className="w-24 h-6 bg-base-300/40 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-base-300/40 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Skeleton Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card-glass p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 w-20 bg-base-300/50 rounded-full animate-pulse mb-3" />
                  <div className="h-8 w-12 bg-base-300/50 rounded-full animate-pulse mb-1" />
                  <div className="h-2.5 w-14 bg-base-300/50 rounded-full animate-pulse" />
                </div>
                <div className="w-11 h-11 rounded-xl bg-base-300/30 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Summary Bar */}
        <div className="glass-card p-5">
          <div className="h-3 w-32 bg-base-300/50 rounded-full animate-pulse mb-4" />
          <div className="h-3 w-full bg-base-300/50 rounded-full animate-pulse mb-3" />
          <div className="flex gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 w-20 bg-base-300/50 rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        {/* Skeleton Filter Bar */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-4">
            <div className="h-8 w-36 bg-base-300/40 rounded-lg animate-pulse" />
            <div className="h-8 w-28 bg-base-300/40 rounded-lg animate-pulse" />
            <div className="h-8 w-28 bg-base-300/40 rounded-lg animate-pulse" />
            <div className="ml-auto flex gap-2">
              <div className="h-8 w-44 bg-base-300/40 rounded-lg animate-pulse" />
              <div className="h-8 w-36 bg-base-300/40 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Skeleton Fornecedor Cards */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glass-card overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-base-300/40 animate-pulse" />
                <div>
                  <div className="h-5 w-40 bg-base-300/50 rounded-full animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-base-300/40 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-20 bg-base-300/40 rounded-full animate-pulse" />
            </div>
            <div className="border-t border-base-200/30 p-4">
              <div className="h-4 w-32 bg-base-300/40 rounded-full animate-pulse mb-3" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-8 w-full bg-base-300/30 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="space-y-6">
        <Toast {...toast} onClose={hideToast} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="glass-card p-8 text-center animate-fadeInUp max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-error/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-base-content/80 mb-2">Erro ao carregar relatório</h3>
            <p className="text-sm text-base-content/50 mb-6">{error}</p>
            <button className="btn btn-primary btn-sm shadow-soft gap-2" onClick={loadRelatorio}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast {...toast} onClose={hideToast} />

      {/* ═══ Header com Orbs ═══ */}
      <div
        className="glass-card p-6 relative overflow-hidden animate-fadeInUp"
        style={{ animationFillMode: 'both' }}
      >
        {/* Orbs decorativos */}
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(55% 0.2 255), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(65% 0.18 200), transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs text-base-content/40 uppercase tracking-wider font-medium mb-1">
              Acompanhamento anual
            </p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Relatório{' '}
              <span className="text-gradient">Mensal</span>
            </h1>
            <p className="text-base-content/50 text-sm mt-1">
              Acompanhamento das medições por fornecedor e contrato
            </p>
          </div>

          {/* Navegação de ano */}
          <div className="glass-card p-1.5 flex items-center gap-1">
            <button
              className="btn btn-ghost btn-sm btn-square hover:bg-base-200/50"
              onClick={() => handleYearChange(-1)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-bold min-w-[80px] text-center px-3 text-lg" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {anoAtual}
            </span>
            <button
              className="btn btn-ghost btn-sm btn-square hover:bg-base-200/50"
              onClick={() => handleYearChange(1)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Cards de Estatísticas ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-animate">
        {/* Total */}
        <div className="stat-card-glass info group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60 font-medium">Total Medições</p>
              <p className="text-3xl font-bold text-info mt-1">{stats.total}</p>
              <p className="text-xs text-base-content/40 mt-0.5">{totalFornecedores} fornecedor{totalFornecedores !== 1 ? 'es' : ''}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-info/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* OK */}
        <div className="stat-card-glass success group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60 font-medium">Em Dia</p>
              <p className="text-3xl font-bold text-success mt-1">{stats.ok}</p>
              <p className="text-xs text-base-content/40 mt-0.5">neste mês</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pendentes */}
        <div className="stat-card-glass warning group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60 font-medium">Pendentes</p>
              <p className="text-3xl font-bold text-warning mt-1">{stats.pendente}</p>
              <p className="text-xs text-base-content/40 mt-0.5">neste mês</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Atrasadas */}
        <div className="stat-card-glass error group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60 font-medium">Atrasadas</p>
              <p className="text-3xl font-bold text-error mt-1">{stats.atrasada}</p>
              <p className="text-xs text-base-content/40 mt-0.5">neste mês</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-error/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Barra de Resumo ═══ */}
      {stats.total > 0 && (
        <div
          className="glass-card p-5 animate-fadeInUp"
          style={{ animationDelay: '0.25s', animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-base-content/70 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Resumo do Mês Atual
            </h3>
            <span className="text-xs text-base-content/40">
              {stats.total} sequência{stats.total !== 1 ? 's' : ''} no total
            </span>
          </div>

          {/* Barra empilhada */}
          <div className="w-full h-3 rounded-full bg-base-300/40 overflow-hidden flex" role="progressbar">
            {stats.ok > 0 && (
              <div
                className="h-full bg-success transition-all duration-1000 ease-out rounded-l-full"
                style={{ width: `${(stats.ok / stats.total) * 100}%` }}
                title={`${stats.ok} em dia`}
              />
            )}
            {stats.pendente > 0 && (
              <div
                className="h-full bg-warning transition-all duration-1000 ease-out"
                style={{ width: `${(stats.pendente / stats.total) * 100}%` }}
                title={`${stats.pendente} pendentes`}
              />
            )}
            {stats.atrasada > 0 && (
              <div
                className="h-full bg-error transition-all duration-1000 ease-out rounded-r-full"
                style={{ width: `${(stats.atrasada / stats.total) * 100}%` }}
                title={`${stats.atrasada} atrasadas`}
              />
            )}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-xs text-base-content/60">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              <span>Em dia ({stats.ok})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-warning" />
              <span>Pendentes ({stats.pendente})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-error" />
              <span>Atrasadas ({stats.atrasada})</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Filtros e Ações ═══ */}
      <div
        className="glass-card p-4 animate-fadeInUp"
        style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro de status */}
          <select
            className="select select-bordered select-sm glass-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="ok">OK</option>
            <option value="pendente">Pendente</option>
            <option value="atrasada">Atrasada</option>
            <option value="nao_aplicavel">N/A</option>
          </select>

          <div className="flex gap-1">
            <button
              className="btn btn-ghost btn-sm gap-1 text-base-content/60 hover:text-base-content"
              onClick={expandAll}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Expandir
            </button>
            <button
              className="btn btn-ghost btn-sm gap-1 text-base-content/60 hover:text-base-content"
              onClick={collapseAll}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
              Recolher
            </button>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              className="btn btn-primary btn-sm shadow-soft gap-1.5"
              onClick={sincronizarSelecionadas}
              disabled={syncing || selectedSequencias.size === 0}
            >
              {syncing ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Sincronizar ({selectedSequencias.size})
            </button>

            <button
              className="btn btn-secondary btn-sm shadow-soft gap-1.5"
              onClick={sincronizarTodas}
              disabled={syncing}
            >
              {syncing ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Todas
            </button>

            <button
              className="btn btn-ghost btn-sm gap-1.5 group"
              onClick={loadRelatorio}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
          </div>
        </div>

        {/* Indicador de filtro ativo */}
        {filterStatus && (
          <div className="mt-3 pt-3 border-t border-base-200/30 flex items-center gap-2 text-xs text-base-content/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtrando por: <span className="font-semibold text-base-content/70">{filterStatus === 'ok' ? 'OK' : filterStatus === 'pendente' ? 'Pendente' : filterStatus === 'atrasada' ? 'Atrasada' : 'N/A'}</span>
            <button
              className="btn btn-ghost btn-xs ml-1"
              onClick={() => setFilterStatus('')}
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* ═══ Lista de Fornecedores ═══ */}
      {dadosFiltrados.length === 0 ? (
        <div
          className="glass-card p-10 animate-fadeInUp"
          style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-info/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-base-content/80">
              Nenhuma medição encontrada
            </h3>
            <p className="text-sm text-base-content/50 mt-1">
              {filterStatus ? 'Tente remover o filtro para ver todas as medições' : `Não há medições para o ano ${anoAtual}`}
            </p>
            {filterStatus && (
              <button
                className="btn btn-primary btn-sm shadow-soft mt-4 gap-1.5"
                onClick={() => setFilterStatus('')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Limpar filtro
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {dadosFiltrados.map((fornecedor, fIdx) => (
            <div
              key={fornecedor._id}
              className="glass-card overflow-hidden animate-fadeInUp"
              style={{ animationDelay: `${0.2 + fIdx * 0.06}s`, animationFillMode: 'both' }}
            >
              {/* Header do Fornecedor */}
              <div
                className="p-4 cursor-pointer hover:bg-base-200/20 transition-colors flex items-center justify-between group"
                onClick={() => toggleFornecedor(fornecedor._id)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar do fornecedor */}
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {fornecedor.nome?.charAt(0)?.toUpperCase() || 'F'}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{fornecedor.nome}</h3>
                    <p className="text-xs text-base-content/40">
                      {fornecedor.contratos?.length || 0} contrato{(fornecedor.contratos?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-base-content/30 transition-transform duration-200 ${expandedFornecedores.has(fornecedor._id) ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <div className="flex items-center gap-2">
                  {/* Checkbox select all do fornecedor */}
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-primary"
                    checked={fornecedor.contratos?.every(c =>
                      c.medicoes?.every(m => selectedSequencias.has(m._id))
                    ) || false}
                    onChange={(e) => {
                      e.stopPropagation();
                      const allMedicoes = fornecedor.contratos?.flatMap(c => c.medicoes || []) || [];
                      const allSelected = allMedicoes.every(m => selectedSequencias.has(m._id));
                      setSelectedSequencias(prev => {
                        const newSet = new Set(prev);
                        allMedicoes.forEach(m => {
                          if (allSelected) {
                            newSet.delete(m._id);
                          } else {
                            newSet.add(m._id);
                          }
                        });
                        return newSet;
                      });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="badge badge-sm bg-base-200/50 text-base-content/60 font-mono">
                    {fornecedor.contratos?.reduce((acc, c) => acc + (c.medicoes?.length || 0), 0) || 0} seq
                  </span>
                </div>
              </div>

              {/* Contratos e Medições */}
              {expandedFornecedores.has(fornecedor._id) && fornecedor.contratos?.length > 0 && (
                <div className="border-t border-base-200/30">
                  {fornecedor.contratos.map((contrato, cIdx) => (
                    <div key={contrato._id} className={cIdx > 0 ? 'border-t border-base-200/20' : ''}>
                      {/* Header do contrato */}
                      <div className="px-4 py-3 bg-base-200/10 flex items-center justify-between">
                        <div className="text-sm font-medium text-base-content/60 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Contrato: <span className="font-mono font-semibold text-base-content/80">{contrato.numero}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-xs"
                            checked={contrato.medicoes?.every(m => selectedSequencias.has(m._id)) || false}
                            onChange={() => {
                              const allSelected = contrato.medicoes.every(m => selectedSequencias.has(m._id));
                              setSelectedSequencias(prev => {
                                const newSet = new Set(prev);
                                contrato.medicoes.forEach(m => {
                                  if (allSelected) {
                                    newSet.delete(m._id);
                                  } else {
                                    newSet.add(m._id);
                                  }
                                });
                                return newSet;
                              });
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs text-base-content/40">
                            {contrato.medicoes?.length || 0} medição{(contrato.medicoes?.length || 0) !== 1 ? 'ões' : ''}
                          </span>
                        </div>
                      </div>

                      {contrato.medicoes?.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="table table-xs table-glass table-pin-rows">
                            <thead>
                              <tr className="text-base-content/50 uppercase text-xs">
                                <th className="w-8 text-center">
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-xs"
                                    checked={contrato.medicoes.every(m => selectedSequencias.has(m._id))}
                                    onChange={() => {
                                      const allSelected = contrato.medicoes.every(m => selectedSequencias.has(m._id));
                                      setSelectedSequencias(prev => {
                                        const newSet = new Set(prev);
                                        contrato.medicoes.forEach(m => {
                                          if (allSelected) {
                                            newSet.delete(m._id);
                                          } else {
                                            newSet.add(m._id);
                                          }
                                        });
                                        return newSet;
                                      });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </th>
                                <th>Est.</th>
                                <th>Seq</th>
                                <th>Receb.</th>
                                <th>Custo</th>
                                <th>Dt.Emis.</th>
                                <th>Dt.Med.</th>
                                <th>Resp.</th>
                                {MESES.map((mes, idx) => (
                                  <th
                                    key={mes}
                                    className={`text-center ${idx === mesAtualIndex ? 'bg-primary/10 text-primary font-bold' : ''}`}
                                  >
                                    {mes}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {contrato.medicoes.map((medicao, mIdx) => (
                                <tr
                                  key={medicao._id}
                                  className="hover:bg-base-200/20 transition-colors"
                                  style={{
                                    animation: 'fadeInUp 0.3s ease forwards',
                                    animationDelay: `${mIdx * 0.03}s`,
                                    opacity: 0
                                  }}
                                >
                                  <td className="text-center">
                                    <input
                                      type="checkbox"
                                      className="checkbox checkbox-xs"
                                      checked={selectedSequencias.has(medicao._id)}
                                      onChange={() => toggleSequencia(medicao._id)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </td>
                                  <td className="text-xs text-base-content/60">{medicao.estabelecimento || '-'}</td>
                                  <td>
                                    <span className="font-semibold text-sm">{medicao.sequencia}</span>
                                  </td>
                                  <td className="text-xs text-base-content/60">{medicao.recebimento || '-'}</td>
                                  <td className="font-mono text-xs">{medicao.custo ? formatCurrency(medicao.custo) : '-'}</td>
                                  <td className="text-xs">
                                    {medicao.dataEmissao ? (
                                      typeof medicao.dataEmissao === 'number' ? (
                                        <span className="badge badge-xs badge-ghost font-mono">Dia {medicao.dataEmissao}</span>
                                      ) : formatDate(medicao.dataEmissao)
                                    ) : '-'}
                                  </td>
                                  <td className="text-xs text-base-content/60">{medicao.dataMedicao ? formatDate(medicao.dataMedicao) : '-'}</td>
                                  <td className="text-xs text-base-content/60">{medicao.responsavel || '-'}</td>
                                  {MESES.map((mes, idx) => {
                                    const status = getStatusMes(medicao.statusMensal, idx);
                                    const isCurrentMonth = idx === mesAtualIndex;
                                    return (
                                      <td
                                        key={mes}
                                        className={`text-center ${isCurrentMonth ? 'bg-primary/5' : ''}`}
                                      >
                                        {status ? (
                                          <span className={`badge badge-xs ${getStatusBadge(status)}`}>
                                            {getStatusLabel(status)}
                                          </span>
                                        ) : (
                                          <span className="text-base-content/20">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <p className="text-sm text-base-content/40 italic">
                            Nenhuma medição neste contrato
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rodapé com informações */}
      {dadosFiltrados.length > 0 && (
        <div className="text-center text-xs text-base-content/30 pb-2">
          {dadosFiltrados.length} fornecedor{dadosFiltrados.length !== 1 ? 'es' : ''} · {stats.total} medição{stats.total !== 1 ? 'ões' : ''} · Ano {anoAtual}
        </div>
      )}
    </div>
  );
}
