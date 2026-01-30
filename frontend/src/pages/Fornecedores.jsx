import { useState, useEffect } from 'react';
import { fornecedoresAPI } from '../services/api';
import Modal, { FormSection, FormRow, FormField, FormDivider } from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';
import Toast from '../components/ui/Toast';

const initialFormData = {
  nome: '',
  cnpj: '',
  contato: '',
  email: '',
  telefone: ''
};

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadFornecedores();
  }, []);

  const loadFornecedores = async () => {
    try {
      setLoading(true);
      const response = await fornecedoresAPI.listar();
      setFornecedores(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      showToast('Erro ao carregar fornecedores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (fornecedor) => {
    setFormData({
      nome: fornecedor.nome || '',
      cnpj: fornecedor.cnpj || '',
      contato: fornecedor.contato || '',
      email: fornecedor.email || '',
      telefone: fornecedor.telefone || ''
    });
    setEditingId(fornecedor._id);
    setIsModalOpen(true);
  };

  const openDeleteDialog = (id) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      showToast('Nome é obrigatório', 'warning');
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await fornecedoresAPI.atualizar(editingId, formData);
        showToast('Fornecedor atualizado com sucesso', 'success');
      } else {
        await fornecedoresAPI.criar(formData);
        showToast('Fornecedor criado com sucesso', 'success');
      }

      setIsModalOpen(false);
      loadFornecedores();
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
      loadFornecedores();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      showToast('Erro ao excluir fornecedor', 'error');
    }
  };

  const filteredFornecedores = fornecedores.filter(f =>
    f.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loading text="Carregando fornecedores..." />;
  }

  return (
    <div className="space-y-6">
      <Toast {...toast} onClose={hideToast} />

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Fornecedores</h1>
          <p className="text-base-content/60">Gerencie os fornecedores do sistema</p>
        </div>
        <button className="btn btn-primary shadow-soft" onClick={openCreateModal}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Fornecedor
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
            placeholder="Buscar fornecedor por nome, CNPJ ou email..."
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

      {/* Lista de Fornecedores */}
      {filteredFornecedores.length === 0 ? (
        <div className="glass-card p-8">
          <EmptyState
            title={searchTerm ? "Nenhum resultado encontrado" : "Nenhum fornecedor cadastrado"}
            description={searchTerm ? "Tente buscar por outro termo" : "Clique em 'Novo Fornecedor' para começar"}
            icon="🏢"
            action={
              !searchTerm && (
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  Adicionar Fornecedor
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-base-200/30">
                <tr className="text-base-content/60 uppercase text-xs">
                  <th>Nome</th>
                  <th>CNPJ</th>
                  <th>Contato</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredFornecedores.map((fornecedor, idx) => (
                  <tr key={fornecedor._id} className="hover:bg-base-200/20 transition-colors" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <td className="font-semibold">{fornecedor.nome}</td>
                    <td className="text-base-content/70 font-mono text-sm">{fornecedor.cnpj || '-'}</td>
                    <td className="text-base-content/70">{fornecedor.contato || '-'}</td>
                    <td>
                      {fornecedor.email ? (
                        <a href={`mailto:${fornecedor.email}`} className="text-primary hover:underline">
                          {fornecedor.email}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="text-base-content/70">{fornecedor.telefone || '-'}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn btn-ghost btn-sm btn-square"
                          onClick={() => openEditModal(fornecedor)}
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
                          onClick={() => openDeleteDialog(fornecedor._id)}
                          title="Excluir"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="p-4 border-t border-base-200/30 bg-base-200/10">
            <p className="text-sm text-base-content/50">
              {filteredFornecedores.length} fornecedor{filteredFornecedores.length !== 1 ? 'es' : ''} encontrado{filteredFornecedores.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Modal de Criar/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        size="md"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn btn-primary shadow-soft" onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : editingId ? 'Salvar' : 'Criar'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados da Empresa */}
          <FormSection title="Dados da Empresa">
            <FormField label="Nome / Razão Social" required>
              <input
                type="text"
                name="nome"
                className="input input-bordered w-full"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Nome do fornecedor"
                required
              />
            </FormField>

            <FormField label="CNPJ" hint="Apenas números ou formatado">
              <input
                type="text"
                name="cnpj"
                className="input input-bordered w-full"
                value={formData.cnpj}
                onChange={handleInputChange}
                placeholder="00.000.000/0000-00"
              />
            </FormField>
          </FormSection>

          <FormDivider />

          {/* Informações de Contato */}
          <FormSection title="Informações de Contato">
            <FormField label="Pessoa de Contato">
              <input
                type="text"
                name="contato"
                className="input input-bordered w-full"
                value={formData.contato}
                onChange={handleInputChange}
                placeholder="Nome do responsável"
              />
            </FormField>

            <FormRow>
              <FormField label="Email">
                <input
                  type="email"
                  name="email"
                  className="input input-bordered w-full"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@exemplo.com"
                />
              </FormField>

              <FormField label="Telefone">
                <input
                  type="text"
                  name="telefone"
                  className="input input-bordered w-full"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  placeholder="(00) 00000-0000"
                />
              </FormField>
            </FormRow>
          </FormSection>
        </form>
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
