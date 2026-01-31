import { useState, useEffect } from 'react';
import { perfisAPI } from '../services/api';
import Modal, { FormField } from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';
import Toast from '../components/ui/Toast';

export default function Perfis() {
  const [perfis, setPerfis] = useState([]);
  const [permissoesDisponiveis, setPermissoesDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    permissoes: [],
    isAdmin: false,
    ativo: true
  });

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [perfisRes, permissoesRes] = await Promise.all([
        perfisAPI.listar(),
        perfisAPI.listarPermissoes()
      ]);
      setPerfis(perfisRes.data || []);
      setPermissoesDisponiveis(permissoesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      nome: '',
      descricao: '',
      permissoes: [],
      isAdmin: false,
      ativo: true
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (perfil) => {
    setFormData({
      nome: perfil.nome || '',
      descricao: perfil.descricao || '',
      permissoes: perfil.permissoes || [],
      isAdmin: perfil.isAdmin || false,
      ativo: perfil.ativo
    });
    setEditingId(perfil._id);
    setIsModalOpen(true);
  };

  const openDeleteDialog = (id) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handlePermissaoChange = (permissaoId) => {
    const novasPermissoes = formData.permissoes.includes(permissaoId)
      ? formData.permissoes.filter(p => p !== permissaoId)
      : [...formData.permissoes, permissaoId];
    setFormData({ ...formData, permissoes: novasPermissoes });
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      showToast('Nome do perfil e obrigatorio', 'warning');
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await perfisAPI.atualizar(editingId, formData);
        showToast('Perfil atualizado com sucesso', 'success');
      } else {
        await perfisAPI.criar(formData);
        showToast('Perfil criado com sucesso', 'success');
      }

      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar perfil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await perfisAPI.excluir(deletingId);
      showToast('Perfil excluido com sucesso', 'success');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir perfil:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir perfil', 'error');
    }
  };

  const filteredPerfis = perfis.filter(p =>
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loading text="Carregando perfis..." />;
  }

  return (
    <div className="space-y-6">
      <Toast {...toast} onClose={hideToast} />

      {/* Cabecalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Perfis de Acesso</h1>
          <p className="text-base-content/60">Gerencie os perfis e permissoes do sistema</p>
        </div>
        <button className="btn btn-primary shadow-soft" onClick={openCreateModal}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Perfil
        </button>
      </div>

      {/* Busca */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar perfil..."
            className="input input-ghost flex-1 glass-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSearchTerm('')}>
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Lista de Perfis */}
      {filteredPerfis.length === 0 ? (
        <div className="glass-card p-8">
          <EmptyState
            title={searchTerm ? "Nenhum resultado encontrado" : "Nenhum perfil cadastrado"}
            description={searchTerm ? "Tente buscar por outro termo" : "Clique em 'Novo Perfil' para comecar"}
            icon="🔐"
            action={
              !searchTerm && (
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  Adicionar Perfil
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPerfis.map((perfil) => (
            <div key={perfil._id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {perfil.nome}
                    {perfil.isAdmin && (
                      <span className="badge badge-primary badge-sm">Admin</span>
                    )}
                  </h3>
                  {perfil.descricao && (
                    <p className="text-sm text-base-content/60 mt-1">{perfil.descricao}</p>
                  )}
                </div>
                <span className={`badge ${perfil.ativo ? 'badge-success' : 'badge-error'}`}>
                  {perfil.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-xs text-base-content/50 uppercase mb-2">Permissoes</p>
                {perfil.isAdmin ? (
                  <span className="badge badge-primary badge-outline">Acesso Total</span>
                ) : perfil.permissoes?.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {perfil.permissoes.map((perm) => (
                      <span key={perm} className="badge badge-ghost badge-sm capitalize">
                        {perm}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-base-content/40">Nenhuma permissao</span>
                )}
              </div>

              <div className="flex justify-end gap-1 border-t border-base-200/30 pt-3">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => openEditModal(perfil)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
                <button
                  className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                  onClick={() => openDeleteDialog(perfil._id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rodape com contagem */}
      {filteredPerfis.length > 0 && (
        <div className="text-center text-sm text-base-content/50">
          {filteredPerfis.length} perfil{filteredPerfis.length !== 1 ? 's' : ''} encontrado{filteredPerfis.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Modal de Criar/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Perfil' : 'Novo Perfil'}
        size="md"
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
        <div className="space-y-4">
          <FormField label="Nome do Perfil" required>
            <input
              type="text"
              className="input input-bordered w-full"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Gerente"
              autoFocus
            />
          </FormField>

          <FormField label="Descricao">
            <textarea
              className="textarea textarea-bordered w-full"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descricao do perfil..."
              rows={2}
            />
          </FormField>

          <FormField label="Tipo de Acesso">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={formData.isAdmin}
                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
              />
              <span className="label-text">
                Administrador (acesso total a todos os modulos)
              </span>
            </label>
          </FormField>

          {!formData.isAdmin && (
            <FormField label="Permissoes">
              <div className="grid grid-cols-2 gap-2 p-3 bg-base-200/30 rounded-lg">
                {permissoesDisponiveis.map((perm) => (
                  <label key={perm.id} className="label cursor-pointer justify-start gap-2 p-2 hover:bg-base-200/50 rounded">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      checked={formData.permissoes.includes(perm.id)}
                      onChange={() => handlePermissaoChange(perm.id)}
                    />
                    <div>
                      <span className="label-text font-medium">{perm.nome}</span>
                      <p className="text-xs text-base-content/50">{perm.descricao}</p>
                    </div>
                  </label>
                ))}
              </div>
            </FormField>
          )}

          <FormField label="Status">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="toggle toggle-success"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              />
              <span className="label-text">{formData.ativo ? 'Ativo' : 'Inativo'}</span>
            </label>
          </FormField>
        </div>
      </Modal>

      {/* Dialog de Confirmacao de Exclusao */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Perfil"
        message="Tem certeza que deseja excluir este perfil? Usuarios com este perfil ficarao sem acesso. Esta acao nao pode ser desfeita."
        confirmText="Excluir"
        variant="error"
      />
    </div>
  );
}
