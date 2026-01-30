import { useState, useEffect, useMemo } from 'react';
import { contratosAPI, fornecedoresAPI, sequenciasAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import Modal, { FormSection, FormRow, FormField } from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';
import Toast from '../components/ui/Toast';

// Estabelecimentos disponíveis
const ESTABELECIMENTOS = [
  { value: '01', label: '01 - PROMA CONTAGEM' },
  { value: '02', label: '02 - PROMA BETIM' },
  { value: '03', label: '03 - PROMA BH' }
];

const initialContratoForm = {
  fornecedor: '',
  'nr-contrato': '',
  'cod-estabel': '01',
  observacao: ''
};

const initialSequenciaForm = {
  'num-seq-item': '',
  diaEmissao: '',
  valor: ''
};

export default function Contratos() {
  const [contratos, setContratos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
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
      const [contratosRes, fornecedoresRes] = await Promise.all([
        contratosAPI.listar(),
        fornecedoresAPI.listar()
      ]);
      setContratos(contratosRes.data || []);
      setFornecedores(fornecedoresRes.data || []);

      // Carregar sequências para cada contrato
      const sequenciasMap = {};
      for (const contrato of contratosRes.data || []) {
        try {
          const seqRes = await sequenciasAPI.listarPorContrato(contrato._id);
          sequenciasMap[contrato._id] = seqRes.data || [];
        } catch {
          sequenciasMap[contrato._id] = [];
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
      const fornecedorId = contrato.fornecedor?._id || contrato.fornecedor;
      const fornecedorNome = contrato.fornecedor?.nome || 'Sem Fornecedor';

      if (!map.has(fornecedorId)) {
        map.set(fornecedorId, {
          _id: fornecedorId,
          nome: fornecedorNome,
          contratos: []
        });
      }

      map.get(fornecedorId).contratos.push(contrato);
    });

    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [contratos]);

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
      fornecedor: contrato.fornecedor?._id || contrato.fornecedor || '',
      'nr-contrato': contrato['nr-contrato'] || '',
      'cod-estabel': contrato['cod-estabel'] || '01',
      observacao: contrato.observacao || ''
    });
    setEditingContratoId(contrato._id);
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
    if (!contratoForm['nr-contrato']) {
      showToast('Número do contrato é obrigatório', 'warning');
      return;
    }

    try {
      setSaving(true);

      const dados = {
        fornecedor: contratoForm.fornecedor,
        'nr-contrato': parseInt(contratoForm['nr-contrato']),
        'cod-estabel': contratoForm['cod-estabel'],
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
      'num-seq-item': sequencia['num-seq-item'] || '',
      diaEmissao: sequencia.diaEmissao || '',
      valor: sequencia.valor || ''
    });
    setEditingSequenciaId(sequencia._id);
    setIsSequenciaModalOpen(true);
  };

  const openDeleteSequenciaDialog = (sequenciaId) => {
    setDeletingSequenciaId(sequenciaId);
    setIsDeleteSequenciaDialogOpen(true);
  };

  const handleSequenciaSubmit = async () => {
    if (!sequenciaForm['num-seq-item']) {
      showToast('Número da sequência é obrigatório', 'warning');
      return;
    }
    if (!sequenciaForm.diaEmissao) {
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
        contrato: selectedContrato._id,
        'num-seq-item': parseInt(sequenciaForm['num-seq-item']),
        diaEmissao: parseInt(sequenciaForm.diaEmissao),
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

  // Obter nome do estabelecimento
  const getEstabelecimentoLabel = (cod) => {
    const estab = ESTABELECIMENTOS.find(e => e.value === cod);
    return estab ? estab.label : cod;
  };

  if (loading) {
    return <Loading text="Carregando contratos..." />;
  }

  return (
    <div className="space-y-6">
      <Toast {...toast} onClose={hideToast} />

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Contratos</h1>
          <p className="text-base-content/60">Gerencie os contratos e suas sequências</p>
        </div>
        <button className="btn btn-primary shadow-soft" onClick={openCreateContratoModal}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Contrato
        </button>
      </div>

      {/* Lista de Fornecedores com Contratos */}
      {contratosPorFornecedor.length === 0 ? (
        <div className="glass-card p-8">
          <EmptyState
            title="Nenhum contrato cadastrado"
            description="Clique em 'Novo Contrato' para começar"
            icon="📄"
            action={
              <button className="btn btn-primary btn-sm" onClick={openCreateContratoModal}>
                Adicionar Contrato
              </button>
            }
          />
        </div>
      ) : (
        <div className="glass-card p-6 space-y-6">
          {contratosPorFornecedor.map((fornecedor) => (
            <div key={fornecedor._id} className="space-y-3">
              {/* Nome do Fornecedor */}
              <h2 className="text-lg font-bold text-primary">{fornecedor.nome}</h2>

              {/* Contratos do Fornecedor */}
              <div className="space-y-2">
                {fornecedor.contratos.map((contrato) => {
                  const sequencias = sequenciasPorContrato[contrato._id] || [];
                  const isExpanded = expandedContratos.has(contrato._id);

                  return (
                    <div key={contrato._id} className="border border-base-200/50 rounded-xl overflow-hidden">
                      {/* Header do Contrato */}
                      <div
                        className="flex items-center justify-between p-4 hover:bg-base-200/30 cursor-pointer transition-colors"
                        onClick={() => toggleContrato(contrato._id)}
                      >
                        <div className="flex items-center gap-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 text-base-content/50 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div>
                            <span className="font-semibold">Contrato {contrato['nr-contrato']} - {contrato['cod-estabel']}</span>
                            <p className="text-sm text-base-content/50">
                              {sequencias.length} sequência(s) | {contrato.observacao || 'Sem observação'}
                            </p>
                          </div>
                        </div>

                        {/* Ações do Contrato */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm btn-primary btn-outline"
                            onClick={() => openCreateSequenciaModal(contrato)}
                            title="Adicionar Sequência"
                          >
                            + Seq
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => openEditContratoModal(contrato)}
                            title="Editar Contrato"
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-sm btn-error btn-outline"
                            onClick={() => openDeleteContratoDialog(contrato._id)}
                            title="Excluir Contrato"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>

                      {/* Sequências do Contrato */}
                      {isExpanded && sequencias.length > 0 && (
                        <div className="border-t border-base-200/30 bg-base-200/10">
                          {sequencias.map((seq) => (
                            <div
                              key={seq._id}
                              className="flex items-center justify-between px-6 py-3 border-b border-base-200/20 last:border-b-0 hover:bg-base-200/20"
                            >
                              <span className="text-base-content/70">
                                Seq. {seq['num-seq-item']} | Dia {seq.diaEmissao} | {formatCurrency(seq.valor)}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  className="btn btn-xs btn-ghost"
                                  onClick={() => openEditSequenciaModal(seq, contrato)}
                                >
                                  Editar
                                </button>
                                <button
                                  className="btn btn-xs btn-square btn-error btn-outline"
                                  onClick={() => openDeleteSequenciaDialog(seq._id)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Sem sequências */}
                      {isExpanded && sequencias.length === 0 && (
                        <div className="border-t border-base-200/30 bg-base-200/10 px-6 py-4 text-center text-base-content/50 text-sm">
                          Nenhuma sequência cadastrada
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

      {/* Modal de Criar/Editar Contrato */}
      <Modal
        isOpen={isContratoModalOpen}
        onClose={() => setIsContratoModalOpen(false)}
        title={editingContratoId ? 'Editar Contrato' : 'Novo Contrato'}
        size="sm"
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
        <div className="space-y-4">
          <FormField label="Fornecedor" required>
            <select
              className="select select-bordered w-full"
              value={contratoForm.fornecedor}
              onChange={(e) => setContratoForm(prev => ({ ...prev, fornecedor: e.target.value }))}
            >
              <option value="">Selecione um fornecedor</option>
              {fornecedores.map(f => (
                <option key={f._id} value={f._id}>{f.nome}</option>
              ))}
            </select>
          </FormField>

          <FormRow>
            <FormField label="Número do Contrato" required>
              <input
                type="number"
                className="input input-bordered w-full"
                value={contratoForm['nr-contrato']}
                onChange={(e) => setContratoForm(prev => ({ ...prev, 'nr-contrato': e.target.value }))}
                placeholder="Ex: 757"
              />
            </FormField>

            <FormField label="Estabelecimento">
              <select
                className="select select-bordered w-full"
                value={contratoForm['cod-estabel']}
                onChange={(e) => setContratoForm(prev => ({ ...prev, 'cod-estabel': e.target.value }))}
              >
                {ESTABELECIMENTOS.map(e => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </FormField>
          </FormRow>

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
        size="sm"
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
                type="number"
                className="input input-bordered w-full"
                value={sequenciaForm['num-seq-item']}
                onChange={(e) => setSequenciaForm(prev => ({ ...prev, 'num-seq-item': e.target.value }))}
                placeholder="Ex: 1"
              />
            </FormField>

            <FormField label="Dia de Emissão" required>
              <input
                type="number"
                className="input input-bordered w-full"
                value={sequenciaForm.diaEmissao}
                onChange={(e) => setSequenciaForm(prev => ({ ...prev, diaEmissao: e.target.value }))}
                placeholder="15"
                min="1"
                max="31"
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
