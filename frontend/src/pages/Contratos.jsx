import { useState, useEffect, useMemo } from 'react';
import { contratosAPI, fornecedoresAPI, sequenciasAPI, estabelecimentosAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import Modal, { FormRow, FormField } from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DayPicker from '../components/ui/DayPicker';
import { useToast } from '../hooks/useToast';
import Toast from '../components/ui/Toast';

const initialContratoForm = {
  fornecedor: '',
  nr_contrato: '',
  estabelecimento: '',
  observacao: ''
};

const initialSequenciaForm = {
  num_seq_item: '',
  dia_emissao: '',
  valor: ''
};

export default function Contratos() {
  const [contratos, setContratos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [estabelecimentos, setEstabelecimentos] = useState([]);
  const [sequenciasPorContrato, setSequenciasPorContrato] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados dos modais
  const [isContratoModalOpen, setIsContratoModalOpen] = useState(false);
  const [isSequenciaModalOpen, setIsSequenciaModalOpen] = useState(false);
  const [isDeleteContratoDialogOpen, setIsDeleteContratoDialogOpen] = useState(false);
  const [isDeleteSequenciaDialogOpen, setIsDeleteSequenciaDialogOpen] = useState(false);

  // Estados de edição
  const [editingContratoId, setEditingContratoId] = useState(null);
  const [editingSequenciaId, setEditingSequenciaId] = useState(null);
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [deletingContratoId, setDeletingContratoId] = useState(null);
  const [deletingSequenciaId, setDeletingSequenciaId] = useState(null);

  // Formulários
  const [contratoForm, setContratoForm] = useState(initialContratoForm);
  const [sequenciaForm, setSequenciaForm] = useState(initialSequenciaForm);

  // Contratos expandidos
  const [expandedContratos, setExpandedContratos] = useState(new Set());

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contratosRes, fornecedoresRes, estabelecimentosRes] = await Promise.all([
        contratosAPI.listar(),
        fornecedoresAPI.listar(),
        estabelecimentosAPI.listar()
      ]);
      setContratos(contratosRes.data || []);
      setFornecedores(fornecedoresRes.data || []);
      setEstabelecimentos(estabelecimentosRes.data || []);

      // Carregar sequências para cada contrato
      const sequenciasMap = {};
      for (const contrato of contratosRes.data || []) {
        try {
          const seqRes = await sequenciasAPI.listarPorContrato(contrato.id);
          sequenciasMap[contrato.id] = seqRes.data || [];
        } catch {
          sequenciasMap[contrato.id] = [];
        }
      }
      setSequenciasPorContrato(sequenciasMap);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar contratos por fornecedor
  const contratosPorFornecedor = useMemo(() => {
    const map = new Map();

    contratos.forEach(contrato => {
      const fornecedorId = contrato.fornecedor?.id || contrato.fornecedor;
      const fornecedorNome = contrato.fornecedor?.nome || 'Sem Fornecedor';

      if (!map.has(fornecedorId)) {
        map.set(fornecedorId, {
          id: fornecedorId,
          nome: fornecedorNome,
          contratos: []
        });
      }

      map.get(fornecedorId).contratos.push(contrato);
    });

    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [contratos]);

  // Total de sequências
  const totalSequencias = useMemo(() => {
    return Object.values(sequenciasPorContrato).reduce((acc, seqs) => acc + seqs.length, 0);
  }, [sequenciasPorContrato]);

  // Toggle expandir contrato
  const toggleContrato = (contratoId) => {
    setExpandedContratos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contratoId)) {
        newSet.delete(contratoId);
      } else {
        newSet.add(contratoId);
      }
      return newSet;
    });
  };

  // ========== CONTRATO HANDLERS ==========

  const openCreateContratoModal = () => {
    setContratoForm(initialContratoForm);
    setEditingContratoId(null);
    setIsContratoModalOpen(true);
  };

  const openEditContratoModal = (contrato) => {
    setContratoForm({
      fornecedor: contrato.fornecedor?.id || contrato.fornecedor || '',
      nr_contrato: contrato.nr_contrato || '',
      estabelecimento: contrato.estabelecimento?.id || contrato.estabelecimento || '',
      observacao: contrato.observacao || ''
    });
    setEditingContratoId(contrato.id);
    setIsContratoModalOpen(true);
  };

  const openDeleteContratoDialog = (contratoId) => {
    setDeletingContratoId(contratoId);
    setIsDeleteContratoDialogOpen(true);
  };

  const handleContratoSubmit = async () => {
    if (!contratoForm.fornecedor) {
      showToast('Selecione um fornecedor', 'warning');
      return;
    }
    if (!contratoForm.nr_contrato) {
      showToast('Número do contrato é obrigatório', 'warning');
      return;
    }
    if (!contratoForm.estabelecimento) {
      showToast('Selecione um estabelecimento', 'warning');
      return;
    }

    try {
      setSaving(true);

      const dados = {
        fornecedor: contratoForm.fornecedor,
        nr_contrato: parseInt(contratoForm.nr_contrato),
        estabelecimento: contratoForm.estabelecimento,
        observacao: contratoForm.observacao
      };

      if (editingContratoId) {
        await contratosAPI.atualizar(editingContratoId, dados);
        showToast('Contrato atualizado com sucesso', 'success');
      } else {
        await contratosAPI.criar(dados);
        showToast('Contrato criado com sucesso', 'success');
      }

      setIsContratoModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar contrato', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContrato = async () => {
    try {
      await contratosAPI.excluir(deletingContratoId);
      showToast('Contrato excluído com sucesso', 'success');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      showToast('Erro ao excluir contrato', 'error');
    }
  };

  // ========== SEQUÊNCIA HANDLERS ==========

  const openCreateSequenciaModal = (contrato) => {
    setSelectedContrato(contrato);
    setSequenciaForm(initialSequenciaForm);
    setEditingSequenciaId(null);
    setIsSequenciaModalOpen(true);
  };

  const openEditSequenciaModal = (sequencia, contrato) => {
    setSelectedContrato(contrato);
    setSequenciaForm({
      num_seq_item: sequencia.num_seq_item || '',
      dia_emissao: sequencia.dia_emissao || '',
      valor: sequencia.valor || ''
    });
    setEditingSequenciaId(sequencia.id);
    setIsSequenciaModalOpen(true);
  };

  const openDeleteSequenciaDialog = (sequenciaId) => {
    setDeletingSequenciaId(sequenciaId);
    setIsDeleteSequenciaDialogOpen(true);
  };

  const handleSequenciaSubmit = async () => {
    if (!sequenciaForm.num_seq_item) {
      showToast('Número da sequência é obrigatório', 'warning');
      return;
    }
    if (!sequenciaForm.dia_emissao) {
      showToast('Dia de emissão é obrigatório', 'warning');
      return;
    }
    if (!sequenciaForm.valor) {
      showToast('Valor é obrigatório', 'warning');
      return;
    }

    try {
      setSaving(true);

      const dados = {
        contrato: selectedContrato.id,
        num_seq_item: parseInt(sequenciaForm.num_seq_item),
        dia_emissao: parseInt(sequenciaForm.dia_emissao),
        valor: parseFloat(sequenciaForm.valor)
      };

      if (editingSequenciaId) {
        await sequenciasAPI.atualizar(editingSequenciaId, dados);
        showToast('Sequência atualizada com sucesso', 'success');
      } else {
        await sequenciasAPI.criar(dados);
        showToast('Sequência criada com sucesso', 'success');
      }

      setIsSequenciaModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar sequência:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar sequência', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSequencia = async () => {
    try {
      await sequenciasAPI.excluir(deletingSequenciaId);
      showToast('Sequência excluída com sucesso', 'success');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir sequência:', error);
      showToast('Erro ao excluir sequência', 'error');
    }
  };

  // Agrupar estabelecimentos por empresa
  const estabelecimentosPorEmpresa = useMemo(() => {
    const map = new Map();
    estabelecimentos.forEach(estab => {
      const empresaId = estab.empresa?.id || 'sem-empresa';
      const empresaNome = estab.empresa?.nome || 'Sem Empresa';
      if (!map.has(empresaId)) {
        map.set(empresaId, { nome: empresaNome, estabelecimentos: [] });
      }
      map.get(empresaId).estabelecimentos.push(estab);
    });
    return Array.from(map.values());
  }, [estabelecimentos]);

  // ── Loading: Skeleton UI ──
  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Skeleton Header */}
        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-7 w-40 bg-base-300/50 rounded-full animate-pulse mb-2" />
              <div className="h-4 w-64 bg-base-300/50 rounded-full animate-pulse" />
            </div>
            <div className="h-10 w-40 bg-base-300/50 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Skeleton Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="stat-card-glass p-4">
              <div className="h-3 w-20 bg-base-300/50 rounded-full animate-pulse mb-2" />
              <div className="h-8 w-12 bg-base-300/50 rounded-full animate-pulse" />
            </div>
          ))}
        </div>

        {/* Skeleton Fornecedor Groups */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glass-card p-6">
            <div className="h-5 w-44 bg-base-300/50 rounded-full animate-pulse mb-4" />
            {[...Array(2)].map((_, j) => (
              <div key={j} className="flex items-center gap-4 p-4 mb-2 rounded-xl bg-base-200/10">
                <div className="w-5 h-5 rounded bg-base-300/40 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-base-300/50 rounded-full animate-pulse mb-2" />
                  <div className="h-3 w-64 bg-base-300/50 rounded-full animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-base-300/50 rounded-lg animate-pulse" />
                  <div className="h-8 w-14 bg-base-300/50 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast {...toast} onClose={hideToast} />

      {/* ═══ Header ═══ */}
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
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              <span className="text-gradient">Contratos</span>
            </h1>
            <p className="text-base-content/50 text-sm mt-1">
              Gerencie os contratos e suas sequências
            </p>
          </div>
          <button
            className="btn btn-primary shadow-soft gap-2 group"
            onClick={openCreateContratoModal}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Contrato
          </button>
        </div>
      </div>

      {/* ═══ Cards de Estatísticas ═══ */}
      <div
        className="grid grid-cols-3 gap-4 stagger-animate animate-fadeInUp"
        style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        <div className="stat-card-glass info group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50 font-medium">Contratos</p>
              <p className="text-2xl font-bold text-info mt-0.5">{contratos.length}</p>
              <p className="text-xs text-base-content/40">cadastrados</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card-glass success group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50 font-medium">Fornecedores</p>
              <p className="text-2xl font-bold text-success mt-0.5">{contratosPorFornecedor.length}</p>
              <p className="text-xs text-base-content/40">com contratos</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card-glass warning group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50 font-medium">Sequências</p>
              <p className="text-2xl font-bold text-warning mt-0.5">{totalSequencias}</p>
              <p className="text-xs text-base-content/40">no total</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Lista de Fornecedores com Contratos ═══ */}
      <div
        className="animate-fadeInUp"
        style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
      >
        {contratosPorFornecedor.length === 0 ? (
          <div className="glass-card p-8">
            <div className="text-center py-10 animate-fadeIn">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-info/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-info"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-base-content/80">
                Nenhum contrato cadastrado
              </h3>
              <p className="text-sm text-base-content/50 mt-1">
                Clique em 'Novo Contrato' para começar
              </p>
              <button
                className="btn btn-primary btn-sm shadow-soft gap-2 mt-4"
                onClick={openCreateContratoModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Adicionar Contrato
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {contratosPorFornecedor.map((fornecedor, fIdx) => (
              <div
                key={fornecedor.id}
                className="glass-card glass-card-hover overflow-hidden"
                style={{
                  animation: 'fadeInUp 0.4s ease forwards',
                  animationDelay: `${0.25 + fIdx * 0.08}s`,
                  opacity: 0,
                }}
              >
                {/* Header do Fornecedor */}
                <div className="px-6 py-4 border-b border-base-200/30 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {fornecedor.nome?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold">{fornecedor.nome}</h2>
                    <p className="text-xs text-base-content/40">
                      {fornecedor.contratos.length} contrato{fornecedor.contratos.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Contratos do Fornecedor */}
                <div className="divide-y divide-base-200/20">
                  {fornecedor.contratos.map((contrato) => {
                    const sequencias = sequenciasPorContrato[contrato.id] || [];
                    const isExpanded = expandedContratos.has(contrato.id);

                    return (
                      <div key={contrato.id}>
                        {/* Header do Contrato */}
                        <div
                          className="flex items-center justify-between px-6 py-3.5 hover:bg-base-200/20 cursor-pointer transition-colors"
                          onClick={() => toggleContrato(contrato.id)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-4 w-4 text-base-content/40 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">Contrato {contrato.nr_contrato}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-base-300/30 text-base-content/50">
                                  {sequencias.length} seq.
                                </span>
                              </div>
                              <p className="text-xs text-base-content/45 mt-0.5 truncate">
                                {contrato.estabelecimento?.empresa?.nome} - {contrato.estabelecimento?.nome} ({contrato.cod_estabel})
                              </p>
                              {contrato.observacao && (
                                <p className="text-xs text-base-content/35 mt-0.5 italic truncate">{contrato.observacao}</p>
                              )}
                            </div>
                          </div>

                          {/* Ações do Contrato */}
                          <div className="flex items-center gap-1.5 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn btn-xs btn-primary btn-outline gap-1 shadow-soft"
                              onClick={() => openCreateSequenciaModal(contrato)}
                              title="Adicionar Sequência"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Seq
                            </button>
                            <button
                              className="btn btn-xs btn-ghost btn-square opacity-60 hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all"
                              onClick={() => openEditContratoModal(contrato)}
                              title="Editar Contrato"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              className="btn btn-xs btn-ghost btn-square opacity-60 hover:opacity-100 text-error hover:bg-error/10 transition-all"
                              onClick={() => openDeleteContratoDialog(contrato.id)}
                              title="Excluir Contrato"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Sequências do Contrato */}
                        {isExpanded && sequencias.length > 0 && (
                          <div className="bg-base-200/5 border-t border-base-200/20">
                            <table className="table table-sm table-glass">
                              <thead>
                                <tr className="text-base-content/40 text-xs">
                                  <th scope="col" className="pl-14">Sequência</th>
                                  <th scope="col" className="text-center">Dia Emissão</th>
                                  <th scope="col" className="text-right">Valor</th>
                                  <th scope="col" className="text-right pr-6">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sequencias.map((seq, sIdx) => (
                                  <tr
                                    key={seq.id}
                                    className="hover:bg-base-200/30"
                                    style={{
                                      animation: 'fadeInUp 0.25s ease forwards',
                                      animationDelay: `${sIdx * 0.04}s`,
                                      opacity: 0,
                                    }}
                                  >
                                    <td className="pl-14">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                                          <span className="text-xs font-bold text-warning">{seq.num_seq_item}</span>
                                        </div>
                                        <span className="text-sm text-base-content/70 font-medium">
                                          Seq. {seq.num_seq_item}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="text-center">
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-base-300/30 text-base-content/60">
                                        Dia {seq.dia_emissao}
                                      </span>
                                    </td>
                                    <td className="text-right text-sm font-medium text-base-content/70">
                                      {formatCurrency(seq.valor)}
                                    </td>
                                    <td className="pr-6">
                                      <div className="flex justify-end gap-1">
                                        <button
                                          className="btn btn-xs btn-ghost btn-square opacity-60 hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all"
                                          onClick={() => openEditSequenciaModal(seq, contrato)}
                                          title="Editar Sequência"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                        <button
                                          className="btn btn-xs btn-ghost btn-square opacity-60 hover:opacity-100 text-error hover:bg-error/10 transition-all"
                                          onClick={() => openDeleteSequenciaDialog(seq.id)}
                                          title="Excluir Sequência"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Sem sequências */}
                        {isExpanded && sequencias.length === 0 && (
                          <div className="border-t border-base-200/20 bg-base-200/5 px-6 py-6 text-center animate-fadeIn">
                            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-base-300/20 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                              </svg>
                            </div>
                            <p className="text-sm text-base-content/40">Nenhuma sequência cadastrada</p>
                            <button
                              className="btn btn-primary btn-xs btn-outline shadow-soft gap-1 mt-3"
                              onClick={() => openCreateSequenciaModal(contrato)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Adicionar Sequência
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criar/Editar Contrato */}
      <Modal
        isOpen={isContratoModalOpen}
        onClose={() => setIsContratoModalOpen(false)}
        title={editingContratoId ? 'Editar Contrato' : 'Novo Contrato'}
        size="md"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setIsContratoModalOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn btn-primary shadow-soft" onClick={handleContratoSubmit} disabled={saving}>
              {saving ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : 'Salvar'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <FormRow>
            <FormField label="Fornecedor" required>
              <select
                className="select select-bordered w-full"
                value={contratoForm.fornecedor}
                onChange={(e) => setContratoForm(prev => ({ ...prev, fornecedor: e.target.value }))}
              >
                <option value="">Selecione um fornecedor</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Número do Contrato" required>
              <input
                type="number"
                className="input input-bordered w-full"
                value={contratoForm.nr_contrato}
                onChange={(e) => setContratoForm(prev => ({ ...prev, nr_contrato: e.target.value }))}
                placeholder="Ex: 757"
              />
            </FormField>
          </FormRow>

          <FormField label="Estabelecimento" required>
            <select
              className="select select-bordered w-full"
              value={contratoForm.estabelecimento}
              onChange={(e) => setContratoForm(prev => ({ ...prev, estabelecimento: e.target.value }))}
            >
              <option value="">Selecione um estabelecimento</option>
              {estabelecimentosPorEmpresa.map(grupo => (
                <optgroup key={grupo.nome} label={grupo.nome}>
                  {grupo.estabelecimentos.map(estab => (
                    <option key={estab.id} value={estab.id}>
                      {estab.cod_estabel} - {estab.nome}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </FormField>

          <FormField label="Observação">
            <input
              type="text"
              className="input input-bordered w-full"
              value={contratoForm.observacao}
              onChange={(e) => setContratoForm(prev => ({ ...prev, observacao: e.target.value }))}
              placeholder="Ex: Necessário atualização de contrato"
            />
          </FormField>
        </div>
      </Modal>

      {/* Modal de Criar/Editar Sequência */}
      <Modal
        isOpen={isSequenciaModalOpen}
        onClose={() => setIsSequenciaModalOpen(false)}
        title={editingSequenciaId ? 'Editar Sequência' : 'Nova Sequência'}
        size="md"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setIsSequenciaModalOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn btn-primary shadow-soft" onClick={handleSequenciaSubmit} disabled={saving}>
              {saving ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : 'Salvar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow>
            <FormField label="Número da Sequência" required>
              <input
                type="text"
                inputMode="numeric"
                className="input input-bordered w-full"
                value={sequenciaForm.num_seq_item}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setSequenciaForm(prev => ({ ...prev, num_seq_item: val }));
                }}
                placeholder="Ex: 1"
              />
            </FormField>

            <FormField label="Dia de Emissão" required>
              <DayPicker
                value={sequenciaForm.dia_emissao}
                onChange={(day) => setSequenciaForm(prev => ({ ...prev, dia_emissao: day }))}
                placeholder="Selecione o dia"
              />
            </FormField>
          </FormRow>

          <FormField label="Valor (R$)" required>
            <input
              type="number"
              className="input input-bordered w-full"
              value={sequenciaForm.valor}
              onChange={(e) => setSequenciaForm(prev => ({ ...prev, valor: e.target.value }))}
              placeholder="Ex: 1.500,00"
              step="0.01"
              min="0"
            />
          </FormField>
        </div>
      </Modal>

      {/* Dialog de Confirmação de Exclusão de Contrato */}
      <ConfirmDialog
        isOpen={isDeleteContratoDialogOpen}
        onClose={() => setIsDeleteContratoDialogOpen(false)}
        onConfirm={handleDeleteContrato}
        title="Excluir Contrato"
        message="Tem certeza que deseja excluir este contrato? Todas as sequências associadas também serão excluídas."
        confirmText="Excluir"
        variant="error"
      />

      {/* Dialog de Confirmação de Exclusão de Sequência */}
      <ConfirmDialog
        isOpen={isDeleteSequenciaDialogOpen}
        onClose={() => setIsDeleteSequenciaDialogOpen(false)}
        onConfirm={handleDeleteSequencia}
        title="Excluir Sequência"
        message="Tem certeza que deseja excluir esta sequência?"
        confirmText="Excluir"
        variant="error"
      />
    </div>
  );
}
