import { useState, useEffect } from 'react';
import { fornecedoresAPI, contratosAPI } from '../services/api';
import Modal, { FormField } from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import Toast from '../components/ui/Toast';

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [nome, setNome] = useState('');

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fornecedoresRes, contratosRes] = await Promise.all([
        fornecedoresAPI.listar(),
        contratosAPI.listar()
      ]);
      setFornecedores(fornecedoresRes.data || []);
      setContratos(contratosRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getContratoCount = (fornecedorId) => {
    return contratos.filter(c => {
      const fId = c.fornecedor?.id || c.fornecedor;
      return fId === fornecedorId;
    }).length;
  };

  const openCreateModal = () => {
    setNome('');
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (fornecedor) => {
    setNome(fornecedor.nome || '');
    setEditingId(fornecedor.id);
    setIsModalOpen(true);
  };

  const openDeleteDialog = (id) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!nome.trim()) {
      showToast('Nome é obrigatório', 'warning');
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await fornecedoresAPI.atualizar(editingId, { nome });
        showToast('Fornecedor atualizado com sucesso', 'success');
      } else {
        await fornecedoresAPI.criar({ nome });
        showToast('Fornecedor criado com sucesso', 'success');
      }

      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      showToast('Erro ao salvar fornecedor', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fornecedoresAPI.excluir(deletingId);
      showToast('Fornecedor excluído com sucesso', 'success');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      showToast('Erro ao excluir fornecedor', 'error');
    }
  };

  const filteredFornecedores = fornecedores.filter(f =>
    f.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Loading: Skeleton UI ──
  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Skeleton Header */}
        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-7 w-48 bg-base-300/50 rounded-full animate-pulse mb-2" />
              <div className="h-4 w-64 bg-base-300/50 rounded-full animate-pulse" />
            </div>
            <div className="h-10 w-44 bg-base-300/50 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Skeleton Search */}
        <div className="glass-card p-4">
          <div className="h-10 w-full bg-base-300/50 rounded-lg animate-pulse" />
        </div>

        {/* Skeleton Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="stat-card-glass p-4">
              <div className="h-3 w-20 bg-base-300/50 rounded-full animate-pulse mb-2" />
              <div className="h-8 w-12 bg-base-300/50 rounded-full animate-pulse" />
            </div>
          ))}
        </div>

        {/* Skeleton Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-base-200/30">
            <div className="h-4 w-32 bg-base-300/50 rounded-full animate-pulse" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-base-200/10">
              <div className="w-8 h-8 rounded-lg bg-base-300/40 animate-pulse" />
              <div className="h-4 w-48 bg-base-300/50 rounded-full animate-pulse" />
              <div className="h-4 w-24 bg-base-300/50 rounded-full animate-pulse ml-auto" />
              <div className="h-4 w-16 bg-base-300/50 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
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
              <span className="text-gradient">Fornecedores</span>
            </h1>
            <p className="text-base-content/50 text-sm mt-1">
              Gerencie os fornecedores do sistema
            </p>
          </div>
          <button
            className="btn btn-primary shadow-soft gap-2 group"
            onClick={openCreateModal}
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
            Novo Fornecedor
          </button>
        </div>
      </div>

      {/* ═══ Busca ═══ */}
      <div
        className="glass-card p-4 animate-fadeInUp"
        style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-base-content/40 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar fornecedor..."
            className="input input-ghost flex-1 glass-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="btn btn-ghost btn-sm gap-1"
              onClick={() => setSearchTerm('')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* ═══ Cards de Estatísticas ═══ */}
      <div
        className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger-animate animate-fadeInUp"
        style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
      >
        <div className="stat-card-glass info group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50 font-medium">Total</p>
              <p className="text-2xl font-bold text-info mt-0.5">{fornecedores.length}</p>
              <p className="text-xs text-base-content/40">fornecedores</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card-glass success group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50 font-medium">Com Contratos</p>
              <p className="text-2xl font-bold text-success mt-0.5">
                {fornecedores.filter(f => getContratoCount(f.id) > 0).length}
              </p>
              <p className="text-xs text-base-content/40">ativos</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card-glass warning group col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50 font-medium">Sem Contratos</p>
              <p className="text-2xl font-bold text-warning mt-0.5">
                {fornecedores.filter(f => getContratoCount(f.id) === 0).length}
              </p>
              <p className="text-xs text-base-content/40">sem vínculo</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Lista de Fornecedores ═══ */}
      <div
        className="animate-fadeInUp"
        style={{ animationDelay: '0.25s', animationFillMode: 'both' }}
      >
        {filteredFornecedores.length === 0 ? (
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
                  {searchTerm ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  )}
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-base-content/80">
                {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum fornecedor cadastrado'}
              </h3>
              <p className="text-sm text-base-content/50 mt-1">
                {searchTerm ? 'Tente buscar por outro termo' : "Clique em 'Novo Fornecedor' para começar"}
              </p>
              {!searchTerm && (
                <button
                  className="btn btn-primary btn-sm shadow-soft gap-2 mt-4"
                  onClick={openCreateModal}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar Fornecedor
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card glass-card-hover overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-sm table-glass">
                <thead>
                  <tr className="text-base-content/50">
                    <th scope="col" className="pl-6">Fornecedor</th>
                    <th scope="col" className="text-center">Contratos</th>
                    <th scope="col" className="text-right pr-6">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFornecedores.map((fornecedor, idx) => {
                    const contratoCount = getContratoCount(fornecedor.id);
                    return (
                      <tr
                        key={fornecedor.id}
                        className="hover:bg-base-200/30 group/row"
                        style={{
                          animation: 'fadeInUp 0.3s ease forwards',
                          animationDelay: `${idx * 0.04}s`,
                          opacity: 0,
                        }}
                      >
                        <td className="pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-primary">
                                {fornecedor.nome?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <span className="font-semibold">{fornecedor.nome}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            contratoCount > 0
                              ? 'bg-success/10 text-success'
                              : 'bg-base-300/30 text-base-content/40'
                          }`}>
                            {contratoCount} contrato{contratoCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="pr-6">
                          <div className="flex justify-end gap-1">
                            <button
                              className="btn btn-ghost btn-sm btn-square opacity-60 hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all"
                              onClick={() => openEditModal(fornecedor)}
                              title="Editar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              className="btn btn-ghost btn-sm btn-square opacity-60 hover:opacity-100 text-error hover:bg-error/10 transition-all"
                              onClick={() => openDeleteDialog(fornecedor.id)}
                              title="Excluir"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-base-200/30 bg-base-200/5">
              <p className="text-xs text-base-content/40">
                {filteredFornecedores.length} fornecedor{filteredFornecedores.length !== 1 ? 'es' : ''} encontrado{filteredFornecedores.length !== 1 ? 's' : ''}
                {searchTerm && ` para "${searchTerm}"`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criar/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        size="sm"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn btn-primary shadow-soft" onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : 'Salvar'}
            </button>
          </>
        }
      >
        <FormField label="Nome do Fornecedor" required>
          <input
            type="text"
            className="input input-bordered w-full"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: DI2S"
            autoFocus
          />
        </FormField>
      </Modal>

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Fornecedor"
        message="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="error"
      />
    </div>
  );
}
