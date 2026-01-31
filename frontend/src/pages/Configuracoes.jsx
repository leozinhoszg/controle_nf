import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usuariosAPI, perfisAPI } from '../services/api';
import Modal, { FormField } from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { ProfileBadgeSimple, PermissionBadge } from '../components/ui/ProfileBadge';
import { useToast } from '../hooks/useToast';
import Toast from '../components/ui/Toast';

export default function Configuracoes() {
  const { usuario: usuarioLogado } = useAuth();
  const [activeTab, setActiveTab] = useState('usuarios');
  const { toast, showToast, hideToast } = useToast();

  // Verificar permissões
  const permissoes = useMemo(() => {
    const perfil = usuarioLogado?.perfil;
    if (!perfil) return { usuarios: false, perfis: false };
    if (perfil.isAdmin) return { usuarios: true, perfis: true };
    const perms = perfil.permissoes || [];
    return {
      usuarios: perms.includes('usuarios'),
      perfis: perms.includes('perfis')
    };
  }, [usuarioLogado?.perfil]);

  // Definir aba inicial baseado nas permissões
  useEffect(() => {
    if (!permissoes.usuarios && permissoes.perfis) {
      setActiveTab('perfis');
    }
  }, [permissoes]);

  return (
    <div className="space-y-6">
      <Toast {...toast} onClose={hideToast} />

      {/* Cabecalho */}
      <div>
        <h1 className="text-2xl font-bold text-gradient">Configuracoes</h1>
        <p className="text-base-content/60">Gerencie usuarios e perfis do sistema</p>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200/50 p-1 w-fit">
        {permissoes.usuarios && (
          <button
            className={`tab ${activeTab === 'usuarios' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('usuarios')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Usuarios
          </button>
        )}
        {permissoes.perfis && (
          <button
            className={`tab ${activeTab === 'perfis' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('perfis')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Perfis
          </button>
        )}
      </div>

      {/* Conteudo das Tabs */}
      {activeTab === 'usuarios' && permissoes.usuarios && (
        <UsuariosTab showToast={showToast} />
      )}
      {activeTab === 'perfis' && permissoes.perfis && (
        <PerfisTab showToast={showToast} />
      )}
    </div>
  );
}

// ==================== TAB DE USUARIOS ====================
function UsuariosTab({ showToast }) {
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
    setFormData({ usuario: '', email: '', senha: '', perfil: '', ativo: true });
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
      if (!editingId) dados.senha = formData.senha;

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
      showToast(error.response?.data?.message || 'Erro ao excluir usuario', 'error');
    }
  };

  const handleToggleAtivo = async (id) => {
    try {
      await usuariosAPI.toggleAtivo(id);
      showToast('Status do usuario atualizado', 'success');
      loadData();
    } catch (error) {
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
      showToast(error.response?.data?.message || 'Erro ao alterar senha', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading text="Carregando usuarios..." />;

  return (
    <>
      {/* Busca e Botao */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="glass-card p-3 flex-1">
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
          </div>
        </div>
        <button className="btn btn-primary shadow-soft" onClick={openCreateModal}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuario
        </button>
      </div>

      {/* Lista */}
      {filteredUsuarios.length === 0 ? (
        <div className="glass-card p-8">
          <EmptyState
            title={searchTerm ? "Nenhum resultado" : "Nenhum usuario"}
            description={searchTerm ? "Tente outro termo" : "Clique em 'Novo Usuario'"}
            icon="👤"
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
                      <ProfileBadgeSimple perfil={usuario.perfil} size="sm" />
                    </td>
                    <td className="text-center">
                      <button
                        className={`badge cursor-pointer ${usuario.ativo ? 'badge-success' : 'badge-error'}`}
                        onClick={() => handleToggleAtivo(usuario._id)}
                      >
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button className="btn btn-ghost btn-sm btn-square" onClick={() => openPasswordModal(usuario._id)} title="Alterar Senha">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                        <button className="btn btn-ghost btn-sm btn-square" onClick={() => openEditModal(usuario)} title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10" onClick={() => openDeleteDialog(usuario._id)} title="Excluir">
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
            <p className="text-sm text-base-content/50">{filteredUsuarios.length} usuario(s)</p>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Usuario' : 'Novo Usuario'}
        size="md"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Salvar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Nome de Usuario" required>
            <input type="text" className="input input-bordered w-full" value={formData.usuario} onChange={(e) => setFormData({ ...formData, usuario: e.target.value })} placeholder="Ex: joao.silva" autoFocus />
          </FormField>
          <FormField label="Email" required>
            <input type="email" className="input input-bordered w-full" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Ex: joao@empresa.com" />
          </FormField>
          {!editingId && (
            <FormField label="Senha" required>
              <input type="password" className="input input-bordered w-full" value={formData.senha} onChange={(e) => setFormData({ ...formData, senha: e.target.value })} placeholder="Minimo 6 caracteres" />
            </FormField>
          )}
          <FormField label="Perfil">
            <select className="select select-bordered w-full" value={formData.perfil} onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}>
              <option value="">Sem perfil</option>
              {perfis.map((p) => (
                <option key={p._id} value={p._id}>{p.nome} {p.isAdmin && '(Admin)'}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            <label className="label cursor-pointer justify-start gap-3">
              <input type="checkbox" className="toggle toggle-primary" checked={formData.ativo} onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })} />
              <span className="label-text">{formData.ativo ? 'Ativo' : 'Inativo'}</span>
            </label>
          </FormField>
        </div>
      </Modal>

      {/* Modal Senha */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Alterar Senha"
        size="sm"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setIsPasswordModalOpen(false)} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Alterar'}
            </button>
          </>
        }
      >
        <FormField label="Nova Senha" required>
          <input type="password" className="input input-bordered w-full" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Minimo 6 caracteres" autoFocus />
        </FormField>
      </Modal>

      {/* Confirmacao Exclusao */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Usuario"
        message="Tem certeza que deseja excluir este usuario?"
        confirmText="Excluir"
        variant="error"
      />
    </>
  );
}

// ==================== TAB DE PERFIS ====================
function PerfisTab({ showToast }) {
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
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ nome: '', descricao: '', permissoes: [], isAdmin: false, ativo: true });
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

  const handlePermissaoChange = (permissaoId) => {
    const novas = formData.permissoes.includes(permissaoId)
      ? formData.permissoes.filter(p => p !== permissaoId)
      : [...formData.permissoes, permissaoId];
    setFormData({ ...formData, permissoes: novas });
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
      showToast(error.response?.data?.message || 'Erro ao excluir perfil', 'error');
    }
  };

  const filteredPerfis = perfis.filter(p =>
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading text="Carregando perfis..." />;

  return (
    <>
      {/* Busca e Botao */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="glass-card p-3 flex-1">
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
          </div>
        </div>
        <button className="btn btn-primary shadow-soft" onClick={openCreateModal}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Perfil
        </button>
      </div>

      {/* Lista */}
      {filteredPerfis.length === 0 ? (
        <div className="glass-card p-8">
          <EmptyState title="Nenhum perfil" description="Clique em 'Novo Perfil'" icon="🔐" />
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
                      <span className="badge badge-warning badge-sm gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Admin
                      </span>
                    )}
                  </h3>
                  {perfil.descricao && <p className="text-sm text-base-content/60 mt-1">{perfil.descricao}</p>}
                </div>
                <span className={`badge ${perfil.ativo ? 'badge-success' : 'badge-error'}`}>
                  {perfil.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-xs text-base-content/50 uppercase mb-2">Permissoes</p>
                {perfil.isAdmin ? (
                  <span className="badge badge-warning badge-outline gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Acesso Total
                  </span>
                ) : perfil.permissoes?.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {perfil.permissoes.map((perm) => (
                      <PermissionBadge key={perm} permissao={perm} size="sm" />
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-base-content/40">Nenhuma</span>
                )}
              </div>
              <div className="flex justify-end gap-1 border-t border-base-200/30 pt-3">
                <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(perfil)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
                <button className="btn btn-ghost btn-sm text-error hover:bg-error/10" onClick={() => { setDeletingId(perfil._id); setIsDeleteDialogOpen(true); }}>
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

      {/* Modal Criar/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Perfil' : 'Novo Perfil'}
        size="md"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Salvar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Nome do Perfil" required>
            <input type="text" className="input input-bordered w-full" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Gerente" autoFocus />
          </FormField>
          <FormField label="Descricao">
            <textarea className="textarea textarea-bordered w-full" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Descricao..." rows={2} />
          </FormField>
          <FormField label="Tipo de Acesso">
            <label className="label cursor-pointer justify-start gap-3">
              <input type="checkbox" className="toggle toggle-primary" checked={formData.isAdmin} onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })} />
              <span className="label-text">Administrador (acesso total)</span>
            </label>
          </FormField>
          {!formData.isAdmin && (
            <FormField label="Permissoes">
              <div className="grid grid-cols-2 gap-2 p-3 bg-base-200/30 rounded-lg">
                {permissoesDisponiveis.map((perm) => (
                  <label key={perm.id} className="label cursor-pointer justify-start gap-2 p-2 hover:bg-base-200/50 rounded">
                    <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" checked={formData.permissoes.includes(perm.id)} onChange={() => handlePermissaoChange(perm.id)} />
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
              <input type="checkbox" className="toggle toggle-success" checked={formData.ativo} onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })} />
              <span className="label-text">{formData.ativo ? 'Ativo' : 'Inativo'}</span>
            </label>
          </FormField>
        </div>
      </Modal>

      {/* Confirmacao Exclusao */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Perfil"
        message="Tem certeza que deseja excluir este perfil?"
        confirmText="Excluir"
        variant="error"
      />
    </>
  );
}
