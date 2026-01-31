import { useState, useEffect } from 'react';
import { usuariosAPI, perfisAPI } from '../services/api';
import Modal, { FormField } from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';
import Toast from '../components/ui/Toast';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [passwordUserId, setPasswordUserId] = useState(null);

  const [formData, setFormData] = useState({
    usuario: '',
    email: '',
    senha: '',
    perfil: '',
    ativo: true
  });
  const [novaSenha, setNovaSenha] = useState('');

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosRes, perfisRes] = await Promise.all([
        usuariosAPI.listar(),
        perfisAPI.listar({ ativo: true })
      ]);
      setUsuarios(usuariosRes.data || []);
      setPerfis(perfisRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      usuario: '',
      email: '',
      senha: '',
      perfil: '',
      ativo: true
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (usuario) => {
    setFormData({
      usuario: usuario.usuario || '',
      email: usuario.email || '',
      senha: '',
      perfil: usuario.perfil?._id || '',
      ativo: usuario.ativo
    });
    setEditingId(usuario._id);
    setIsModalOpen(true);
  };

  const openDeleteDialog = (id) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const openPasswordModal = (id) => {
    setPasswordUserId(id);
    setNovaSenha('');
    setIsPasswordModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.usuario.trim()) {
      showToast('Nome de usuario e obrigatorio', 'warning');
      return;
    }
    if (!formData.email.trim()) {
      showToast('Email e obrigatorio', 'warning');
      return;
    }
    if (!editingId && !formData.senha) {
      showToast('Senha e obrigatoria para novos usuarios', 'warning');
      return;
    }

    try {
      setSaving(true);

      const dados = {
        usuario: formData.usuario,
        email: formData.email,
        perfil: formData.perfil || null,
        ativo: formData.ativo
      };

      if (!editingId) {
        dados.senha = formData.senha;
      }

      if (editingId) {
        await usuariosAPI.atualizar(editingId, dados);
        showToast('Usuario atualizado com sucesso', 'success');
      } else {
        await usuariosAPI.criar(dados);
        showToast('Usuario criado com sucesso', 'success');
      }

      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar usuario:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar usuario', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await usuariosAPI.excluir(deletingId);
      showToast('Usuario excluido com sucesso', 'success');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir usuario:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir usuario', 'error');
    }
  };

  const handleToggleAtivo = async (id) => {
    try {
      await usuariosAPI.toggleAtivo(id);
      showToast('Status do usuario atualizado', 'success');
      loadData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      showToast(error.response?.data?.message || 'Erro ao alterar status', 'error');
    }
  };

  const handleChangePassword = async () => {
    if (!novaSenha || novaSenha.length < 6) {
      showToast('Senha deve ter no minimo 6 caracteres', 'warning');
      return;
    }

    try {
      setSaving(true);
      await usuariosAPI.alterarSenha(passwordUserId, novaSenha);
      showToast('Senha alterada com sucesso', 'success');
      setIsPasswordModalOpen(false);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      showToast(error.response?.data?.message || 'Erro ao alterar senha', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loading text="Carregando usuarios..." />;
  }

  return (
    <div className="space-y-6">
      <Toast {...toast} onClose={hideToast} />

      {/* Cabecalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Usuarios</h1>
          <p className="text-base-content/60">Gerencie os usuarios do sistema</p>
        </div>
        <button className="btn btn-primary shadow-soft" onClick={openCreateModal}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuario
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
            placeholder="Buscar por nome ou email..."
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

      {/* Lista de Usuarios */}
      {filteredUsuarios.length === 0 ? (
        <div className="glass-card p-8">
          <EmptyState
            title={searchTerm ? "Nenhum resultado encontrado" : "Nenhum usuario cadastrado"}
            description={searchTerm ? "Tente buscar por outro termo" : "Clique em 'Novo Usuario' para comecar"}
            icon="👤"
            action={
              !searchTerm && (
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  Adicionar Usuario
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
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario._id} className="hover:bg-base-200/20 transition-colors">
                    <td className="font-semibold">{usuario.usuario}</td>
                    <td className="text-base-content/70">{usuario.email}</td>
                    <td>
                      {usuario.perfil ? (
                        <span className={`badge ${usuario.perfil.isAdmin ? 'badge-primary' : 'badge-secondary'}`}>
                          {usuario.perfil.nome}
                        </span>
                      ) : (
                        <span className="badge badge-ghost">Sem perfil</span>
                      )}
                    </td>
                    <td className="text-center">
                      <button
                        className={`badge cursor-pointer ${usuario.ativo ? 'badge-success' : 'badge-error'}`}
                        onClick={() => handleToggleAtivo(usuario._id)}
                        title="Clique para alterar"
                      >
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn btn-ghost btn-sm btn-square"
                          onClick={() => openPasswordModal(usuario._id)}
                          title="Alterar Senha"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-square"
                          onClick={() => openEditModal(usuario)}
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
                          onClick={() => openDeleteDialog(usuario._id)}
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
              {filteredUsuarios.length} usuario{filteredUsuarios.length !== 1 ? 's' : ''} encontrado{filteredUsuarios.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Modal de Criar/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Usuario' : 'Novo Usuario'}
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
          <FormField label="Nome de Usuario" required>
            <input
              type="text"
              className="input input-bordered w-full"
              value={formData.usuario}
              onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
              placeholder="Ex: joao.silva"
              autoFocus
            />
          </FormField>

          <FormField label="Email" required>
            <input
              type="email"
              className="input input-bordered w-full"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Ex: joao@empresa.com"
            />
          </FormField>

          {!editingId && (
            <FormField label="Senha" required>
              <input
                type="password"
                className="input input-bordered w-full"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                placeholder="Minimo 6 caracteres"
              />
            </FormField>
          )}

          <FormField label="Perfil">
            <select
              className="select select-bordered w-full"
              value={formData.perfil}
              onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
            >
              <option value="">Sem perfil</option>
              {perfis.map((perfil) => (
                <option key={perfil._id} value={perfil._id}>
                  {perfil.nome} {perfil.isAdmin && '(Admin)'}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Status">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              />
              <span className="label-text">{formData.ativo ? 'Ativo' : 'Inativo'}</span>
            </label>
          </FormField>
        </div>
      </Modal>

      {/* Modal de Alterar Senha */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Alterar Senha"
        size="sm"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setIsPasswordModalOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn btn-primary shadow-soft" onClick={handleChangePassword} disabled={saving}>
              {saving ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : 'Alterar Senha'}
            </button>
          </>
        }
      >
        <FormField label="Nova Senha" required>
          <input
            type="password"
            className="input input-bordered w-full"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Minimo 6 caracteres"
            autoFocus
          />
        </FormField>
      </Modal>

      {/* Dialog de Confirmacao de Exclusao */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Usuario"
        message="Tem certeza que deseja excluir este usuario? Esta acao nao pode ser desfeita."
        confirmText="Excluir"
        variant="error"
      />
    </div>
  );
}
