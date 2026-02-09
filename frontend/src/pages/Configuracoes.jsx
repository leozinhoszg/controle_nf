import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usuariosAPI, perfisAPI, auditoriaAPI, empresasAPI, estabelecimentosAPI } from '../services/api';
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
    if (!perfil) return { usuarios: false, perfis: false, auditoria: false, empresas: false };
    if (perfil.isAdmin) return { usuarios: true, perfis: true, auditoria: true, empresas: true };
    const perms = perfil.permissoes || [];
    return {
      usuarios: perms.includes('usuarios'),
      perfis: perms.includes('perfis'),
      auditoria: perms.includes('auditoria'),
      empresas: perms.includes('empresas') || perms.includes('estabelecimentos')
    };
  }, [usuarioLogado?.perfil]);

  // Definir aba inicial baseado nas permissões
  useEffect(() => {
    if (!permissoes.usuarios && permissoes.perfis) {
      setActiveTab('perfis');
    } else if (!permissoes.usuarios && !permissoes.perfis && permissoes.auditoria) {
      setActiveTab('auditoria');
    } else if (!permissoes.usuarios && !permissoes.perfis && !permissoes.auditoria && permissoes.empresas) {
      setActiveTab('empresas');
    }
  }, [permissoes]);

  return (
    <div className="space-y-6">
      <Toast {...toast} onClose={hideToast} />

      {/* Cabecalho */}
      <div>
        <h1 className="text-2xl font-bold text-gradient">Configuracoes</h1>
        <p className="text-base-content/50 text-sm mt-1">Gerencie usuarios e perfis do sistema</p>
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
        {permissoes.auditoria && (
          <button
            className={`tab ${activeTab === 'auditoria' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('auditoria')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Auditoria
          </button>
        )}
        {permissoes.empresas && (
          <button
            className={`tab ${activeTab === 'empresas' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('empresas')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Empresas
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
      {activeTab === 'auditoria' && permissoes.auditoria && (
        <AuditoriaTab showToast={showToast} />
      )}
      {activeTab === 'empresas' && permissoes.empresas && (
        <EmpresasTab showToast={showToast} />
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
    setFormData({ usuario: '', email: '', perfil: '', ativo: true });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (usuario) => {
    setFormData({
      usuario: usuario.usuario || '',
      email: usuario.email || '',
      perfil: usuario.perfil?.id || '',
      ativo: usuario.ativo
    });
    setEditingId(usuario.id);
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

    try {
      setSaving(true);
      const dados = {
        usuario: formData.usuario,
        email: formData.email,
        perfil: formData.perfil || null,
        ativo: formData.ativo
      };

      if (editingId) {
        await usuariosAPI.atualizar(editingId, dados);
        showToast('Usuario atualizado com sucesso', 'success');
      } else {
        await usuariosAPI.criar(dados);
        showToast('Usuario criado! Um email foi enviado para definir a senha.', 'success');
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
                  <tr key={usuario.id} className="hover:bg-base-200/20 transition-colors">
                    <td className="font-semibold">{usuario.usuario}</td>
                    <td className="text-base-content/70">{usuario.email}</td>
                    <td>
                      <ProfileBadgeSimple perfil={usuario.perfil} size="sm" />
                    </td>
                    <td className="text-center">
                      <button
                        className={`badge cursor-pointer ${usuario.ativo ? 'badge-success' : 'badge-error'}`}
                        onClick={() => handleToggleAtivo(usuario.id)}
                      >
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button className="btn btn-ghost btn-sm btn-square" onClick={() => openPasswordModal(usuario.id)} title="Alterar Senha">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                        <button className="btn btn-ghost btn-sm btn-square" onClick={() => openEditModal(usuario)} title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10" onClick={() => openDeleteDialog(usuario.id)} title="Excluir">
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
            <div className="alert alert-info text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>O usuario recebera um email para definir sua propria senha.</span>
            </div>
          )}
          <FormField label="Perfil">
            <select className="select select-bordered w-full" value={formData.perfil} onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}>
              <option value="">Sem perfil</option>
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} {p.isAdmin && '(Admin)'}</option>
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
    setEditingId(perfil.id);
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
            <div key={perfil.id} className="glass-card p-5">
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
                <button className="btn btn-ghost btn-sm text-error hover:bg-error/10" onClick={() => { setDeletingId(perfil.id); setIsDeleteDialogOpen(true); }}>
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

// ==================== TAB DE AUDITORIA ====================
function AuditoriaTab({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Paginacao
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const limite = 20;

  // Filtros
  const [filtros, setFiltros] = useState({
    categoria: '',
    nivel: '',
    dataInicio: '',
    dataFim: '',
    busca: ''
  });

  // Detalhes do log selecionado
  const [logSelecionado, setLogSelecionado] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const categorias = [
    { id: 'AUTH', nome: 'Autenticacao' },
    { id: 'USUARIO', nome: 'Usuarios' },
    { id: 'PERFIL', nome: 'Perfis' },
    { id: 'FORNECEDOR', nome: 'Fornecedores' },
    { id: 'CONTRATO', nome: 'Contratos' },
    { id: 'SEQUENCIA', nome: 'Sequencias' },
    { id: 'MEDICAO', nome: 'Medicoes' },
    { id: 'SISTEMA', nome: 'Sistema' },
    { id: 'EMAIL', nome: 'Emails' }
  ];

  const niveis = [
    { id: 'INFO', nome: 'Info', cor: 'badge-info' },
    { id: 'WARN', nome: 'Aviso', cor: 'badge-warning' },
    { id: 'ERROR', nome: 'Erro', cor: 'badge-error' },
    { id: 'CRITICAL', nome: 'Critico', cor: 'badge-error' }
  ];

  useEffect(() => {
    loadData();
  }, [pagina, filtros]);

  useEffect(() => {
    loadEstatisticas();
  }, []);

  const loadData = async () => {
    try {
      if (pagina === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        pagina,
        limite,
        ...filtros
      };

      // Remover campos vazios
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await auditoriaAPI.listar(params);
      setLogs(response.data.logs || []);
      setTotalPaginas(response.data.paginacao?.totalPaginas || 1);
      setTotalLogs(response.data.paginacao?.total || 0);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      showToast('Erro ao carregar logs de auditoria', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadEstatisticas = async () => {
    try {
      const response = await auditoriaAPI.estatisticas('30d');
      setEstatisticas(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatisticas:', error);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPagina(1);
  };

  const limparFiltros = () => {
    setFiltros({
      categoria: '',
      nivel: '',
      dataInicio: '',
      dataFim: '',
      busca: ''
    });
    setPagina(1);
  };

  const handleExportar = async (formato) => {
    try {
      setExporting(true);
      const params = {
        formato,
        ...filtros
      };

      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await auditoriaAPI.exportar(params);

      if (formato === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `auditoria_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }

      showToast('Arquivo exportado com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao exportar dados', 'error');
    } finally {
      setExporting(false);
    }
  };

  const openDetailModal = (log) => {
    setLogSelecionado(log);
    setIsDetailModalOpen(true);
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNivelBadge = (nivel) => {
    const nivelConfig = niveis.find(n => n.id === nivel);
    return nivelConfig?.cor || 'badge-ghost';
  };

  const renderCamposAlterados = (log) => {
    if (!log.dados_anteriores && !log.dados_novos) return null;

    const campos = log.campos_alterados || [];
    if (campos.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="font-semibold text-sm mb-2">Campos Alterados:</h4>
        <div className="overflow-x-auto">
          <table className="table table-xs">
            <thead>
              <tr>
                <th>Campo</th>
                <th>Valor Anterior</th>
                <th>Valor Novo</th>
              </tr>
            </thead>
            <tbody>
              {campos.map((campo) => (
                <tr key={campo}>
                  <td className="font-medium">{campo}</td>
                  <td className="text-error/70">
                    {JSON.stringify(log.dados_anteriores?.[campo]) || '-'}
                  </td>
                  <td className="text-success/70">
                    {JSON.stringify(log.dados_novos?.[campo]) || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) return <Loading text="Carregando logs de auditoria..." />;

  return (
    <>
      {/* Estatisticas */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-primary">{estatisticas.total || 0}</div>
            <div className="text-sm text-base-content/60">Total de Logs (30 dias)</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-success">{estatisticas.porNivel?.INFO || 0}</div>
            <div className="text-sm text-base-content/60">Informacoes</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-warning">{estatisticas.porNivel?.WARN || 0}</div>
            <div className="text-sm text-base-content/60">Avisos</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-error">
              {(estatisticas.porNivel?.ERROR || 0) + (estatisticas.porNivel?.CRITICAL || 0)}
            </div>
            <div className="text-sm text-base-content/60">Erros/Criticos</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="glass-card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="label label-text text-xs">Buscar</label>
            <input
              type="text"
              placeholder="Usuario, acao..."
              className="input input-bordered input-sm w-full"
              value={filtros.busca}
              onChange={(e) => handleFiltroChange('busca', e.target.value)}
            />
          </div>
          <div>
            <label className="label label-text text-xs">Categoria</label>
            <select
              className="select select-bordered select-sm w-full"
              value={filtros.categoria}
              onChange={(e) => handleFiltroChange('categoria', e.target.value)}
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label label-text text-xs">Nivel</label>
            <select
              className="select select-bordered select-sm w-full"
              value={filtros.nivel}
              onChange={(e) => handleFiltroChange('nivel', e.target.value)}
            >
              <option value="">Todos</option>
              {niveis.map((nivel) => (
                <option key={nivel.id} value={nivel.id}>{nivel.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label label-text text-xs">Data Inicio</label>
            <input
              type="date"
              className="input input-bordered input-sm w-full"
              value={filtros.dataInicio}
              onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
            />
          </div>
          <div>
            <label className="label label-text text-xs">Data Fim</label>
            <input
              type="date"
              className="input input-bordered input-sm w-full"
              value={filtros.dataFim}
              onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-between items-center mt-3">
          <button className="btn btn-ghost btn-sm" onClick={limparFiltros}>
            Limpar Filtros
          </button>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-primary btn-sm">
              {exporting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Exportar
            </label>
            <ul tabIndex={0} className="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-40">
              <li><button onClick={() => handleExportar('csv')}>CSV</button></li>
              <li><button onClick={() => handleExportar('json')}>JSON</button></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabela de Logs */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead className="bg-base-200/30">
              <tr className="text-base-content/60 uppercase text-xs">
                <th>Data/Hora</th>
                <th>Usuario</th>
                <th>Acao</th>
                <th>Categoria</th>
                <th>Nivel</th>
                <th>Recurso</th>
                <th className="text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-base-content/50">
                    Nenhum log encontrado
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-base-200/20 transition-colors">
                    <td className="text-xs whitespace-nowrap">{formatarData(log.created_at)}</td>
                    <td className="font-medium">{log.usuario_nome || 'Sistema'}</td>
                    <td className="text-sm">{log.acao?.replace(/_/g, ' ')}</td>
                    <td>
                      <span className="badge badge-ghost badge-sm">{log.categoria}</span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${getNivelBadge(log.nivel)}`}>
                        {log.nivel}
                      </span>
                    </td>
                    <td className="text-sm text-base-content/70">{log.recurso}</td>
                    <td className="text-right">
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => openDetailModal(log)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginacao */}
        <div className="p-4 border-t border-base-200/30 bg-base-200/10 flex justify-between items-center">
          <p className="text-sm text-base-content/50">
            {totalLogs} log(s) encontrado(s) - Pagina {pagina} de {totalPaginas}
          </p>
          <div className="join">
            <button
              className="join-item btn btn-sm"
              disabled={pagina <= 1 || loadingMore}
              onClick={() => setPagina(p => p - 1)}
            >
              Anterior
            </button>
            <button
              className="join-item btn btn-sm"
              disabled={pagina >= totalPaginas || loadingMore}
              onClick={() => setPagina(p => p + 1)}
            >
              {loadingMore ? <span className="loading loading-spinner loading-xs"></span> : 'Proxima'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalhes do Log"
        size="lg"
        actions={
          <button className="btn btn-ghost" onClick={() => setIsDetailModalOpen(false)}>
            Fechar
          </button>
        }
      >
        {logSelecionado && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-base-content/50">Data/Hora</label>
                <p className="font-medium">{formatarData(logSelecionado.created_at)}</p>
              </div>
              <div>
                <label className="text-xs text-base-content/50">Usuario</label>
                <p className="font-medium">{logSelecionado.usuario_nome || 'Sistema'}</p>
                {logSelecionado.usuario_email && (
                  <p className="text-sm text-base-content/60">{logSelecionado.usuario_email}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-base-content/50">Acao</label>
                <p className="font-medium">{logSelecionado.acao?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <label className="text-xs text-base-content/50">Categoria</label>
                <span className="badge badge-ghost">{logSelecionado.categoria}</span>
              </div>
              <div>
                <label className="text-xs text-base-content/50">Nivel</label>
                <span className={`badge ${getNivelBadge(logSelecionado.nivel)}`}>
                  {logSelecionado.nivel}
                </span>
              </div>
              <div>
                <label className="text-xs text-base-content/50">Recurso</label>
                <p className="font-medium">{logSelecionado.recurso}</p>
                {logSelecionado.recurso_id && (
                  <p className="text-xs text-base-content/50">ID: {logSelecionado.recurso_id}</p>
                )}
              </div>
            </div>

            {logSelecionado.descricao && (
              <div>
                <label className="text-xs text-base-content/50">Descricao</label>
                <p className="p-2 bg-base-200/30 rounded">{logSelecionado.descricao}</p>
              </div>
            )}

            {logSelecionado.endereco_ip && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-base-content/50">Endereco IP</label>
                  <p className="font-mono text-sm">{logSelecionado.endereco_ip}</p>
                </div>
                {logSelecionado.user_agent && (
                  <div>
                    <label className="text-xs text-base-content/50">User Agent</label>
                    <p className="text-xs text-base-content/60 truncate" title={logSelecionado.user_agent}>
                      {logSelecionado.user_agent}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!logSelecionado.sucesso && logSelecionado.mensagem_erro && (
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{logSelecionado.mensagem_erro}</span>
              </div>
            )}

            {renderCamposAlterados(logSelecionado)}

            {logSelecionado.dados_anteriores && (
              <div>
                <label className="text-xs text-base-content/50">Dados Anteriores</label>
                <pre className="p-2 bg-base-200/30 rounded text-xs overflow-x-auto">
                  {JSON.stringify(logSelecionado.dados_anteriores, null, 2)}
                </pre>
              </div>
            )}

            {logSelecionado.dados_novos && (
              <div>
                <label className="text-xs text-base-content/50">Dados Novos</label>
                <pre className="p-2 bg-base-200/30 rounded text-xs overflow-x-auto">
                  {JSON.stringify(logSelecionado.dados_novos, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

// ==================== TAB DE EMPRESAS ====================
function EmpresasTab({ showToast }) {
  const [empresas, setEmpresas] = useState([]);
  const [estabelecimentos, setEstabelecimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subTab, setSubTab] = useState('empresas');

  // Modal de empresa
  const [isEmpresaModalOpen, setIsEmpresaModalOpen] = useState(false);
  const [editingEmpresaId, setEditingEmpresaId] = useState(null);
  const [empresaForm, setEmpresaForm] = useState({ cod_empresa: '', nome: '' });

  // Modal de estabelecimento
  const [isEstabelecimentoModalOpen, setIsEstabelecimentoModalOpen] = useState(false);
  const [editingEstabelecimentoId, setEditingEstabelecimentoId] = useState(null);
  const [estabelecimentoForm, setEstabelecimentoForm] = useState({ empresa: '', cod_estabel: '', nome: '' });

  // Delete dialogs
  const [isDeleteEmpresaDialogOpen, setIsDeleteEmpresaDialogOpen] = useState(false);
  const [isDeleteEstabelecimentoDialogOpen, setIsDeleteEstabelecimentoDialogOpen] = useState(false);
  const [deletingEmpresaId, setDeletingEmpresaId] = useState(null);
  const [deletingEstabelecimentoId, setDeletingEstabelecimentoId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empresasRes, estabelecimentosRes] = await Promise.all([
        empresasAPI.listar(),
        estabelecimentosAPI.listar()
      ]);
      setEmpresas(empresasRes.data || []);
      setEstabelecimentos(estabelecimentosRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getEstabelecimentoCount = (empresaId) => {
    return estabelecimentos.filter(e => {
      const eId = e.empresa?.id || e.empresa;
      return eId === empresaId;
    }).length;
  };

  // ========== EMPRESA ==========
  const openCreateEmpresaModal = () => {
    setEmpresaForm({ cod_empresa: '', nome: '' });
    setEditingEmpresaId(null);
    setIsEmpresaModalOpen(true);
  };

  const openEditEmpresaModal = (empresa) => {
    setEmpresaForm({ cod_empresa: empresa.cod_empresa || '', nome: empresa.nome || '' });
    setEditingEmpresaId(empresa.id);
    setIsEmpresaModalOpen(true);
  };

  const handleEmpresaSubmit = async () => {
    if (!empresaForm.cod_empresa.trim() || !empresaForm.nome.trim()) {
      showToast('Codigo e nome sao obrigatorios', 'warning');
      return;
    }
    try {
      setSaving(true);
      if (editingEmpresaId) {
        await empresasAPI.atualizar(editingEmpresaId, empresaForm);
        showToast('Empresa atualizada com sucesso', 'success');
      } else {
        await empresasAPI.criar(empresaForm);
        showToast('Empresa criada com sucesso', 'success');
      }
      setIsEmpresaModalOpen(false);
      loadData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Erro ao salvar empresa', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmpresa = async () => {
    try {
      await empresasAPI.excluir(deletingEmpresaId);
      showToast('Empresa excluida com sucesso', 'success');
      loadData();
    } catch (error) {
      showToast('Erro ao excluir empresa', 'error');
    }
  };

  // ========== ESTABELECIMENTO ==========
  const openCreateEstabelecimentoModal = () => {
    setEstabelecimentoForm({ empresa: empresas[0]?.id || '', cod_estabel: '', nome: '' });
    setEditingEstabelecimentoId(null);
    setIsEstabelecimentoModalOpen(true);
  };

  const openEditEstabelecimentoModal = (estabelecimento) => {
    setEstabelecimentoForm({
      empresa: estabelecimento.empresa?.id || estabelecimento.empresa || '',
      cod_estabel: estabelecimento.cod_estabel || '',
      nome: estabelecimento.nome || ''
    });
    setEditingEstabelecimentoId(estabelecimento.id);
    setIsEstabelecimentoModalOpen(true);
  };

  const handleEstabelecimentoSubmit = async () => {
    if (!estabelecimentoForm.empresa || !estabelecimentoForm.cod_estabel.trim() || !estabelecimentoForm.nome.trim()) {
      showToast('Empresa, codigo e nome sao obrigatorios', 'warning');
      return;
    }
    try {
      setSaving(true);
      if (editingEstabelecimentoId) {
        await estabelecimentosAPI.atualizar(editingEstabelecimentoId, estabelecimentoForm);
        showToast('Estabelecimento atualizado com sucesso', 'success');
      } else {
        await estabelecimentosAPI.criar(estabelecimentoForm);
        showToast('Estabelecimento criado com sucesso', 'success');
      }
      setIsEstabelecimentoModalOpen(false);
      loadData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Erro ao salvar estabelecimento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEstabelecimento = async () => {
    try {
      await estabelecimentosAPI.excluir(deletingEstabelecimentoId);
      showToast('Estabelecimento excluido com sucesso', 'success');
      loadData();
    } catch (error) {
      showToast('Erro ao excluir estabelecimento', 'error');
    }
  };

  const filteredEmpresas = empresas.filter(e =>
    e.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cod_empresa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEstabelecimentos = estabelecimentos.filter(e =>
    e.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cod_estabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.empresa?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading text="Carregando empresas..." />;

  return (
    <>
      {/* Sub-tabs */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="tabs tabs-boxed bg-base-200/50 p-1">
          <button
            className={`tab ${subTab === 'empresas' ? 'tab-active' : ''}`}
            onClick={() => setSubTab('empresas')}
          >
            Empresas ({empresas.length})
          </button>
          <button
            className={`tab ${subTab === 'estabelecimentos' ? 'tab-active' : ''}`}
            onClick={() => setSubTab('estabelecimentos')}
          >
            Estabelecimentos ({estabelecimentos.length})
          </button>
        </div>
        <button
          className="btn btn-primary shadow-soft ml-auto"
          onClick={subTab === 'empresas' ? openCreateEmpresaModal : openCreateEstabelecimentoModal}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {subTab === 'empresas' ? 'Nova Empresa' : 'Novo Estabelecimento'}
        </button>
      </div>

      {/* Busca */}
      <div className="glass-card p-3 mb-4">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={`Buscar ${subTab === 'empresas' ? 'empresa' : 'estabelecimento'}...`}
            className="input input-ghost flex-1 glass-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Empresas */}
      {subTab === 'empresas' && (
        <>
          {filteredEmpresas.length === 0 ? (
            <div className="glass-card p-8">
              <EmptyState
                title={searchTerm ? "Nenhum resultado" : "Nenhuma empresa"}
                description={searchTerm ? "Tente outro termo" : "Clique em 'Nova Empresa'"}
                icon="🏢"
              />
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="bg-base-200/30">
                    <tr className="text-base-content/60 uppercase text-xs">
                      <th>Codigo</th>
                      <th>Nome</th>
                      <th className="text-center">Estabelecimentos</th>
                      <th className="text-center">Status</th>
                      <th className="text-right">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmpresas.map((empresa) => (
                      <tr key={empresa.id} className="hover:bg-base-200/20 transition-colors">
                        <td className="font-mono font-semibold">{empresa.cod_empresa}</td>
                        <td className="font-semibold">{empresa.nome}</td>
                        <td className="text-center">
                          <span className={`badge ${getEstabelecimentoCount(empresa.id) > 0 ? 'badge-primary' : 'badge-ghost'}`}>
                            {getEstabelecimentoCount(empresa.id)}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`badge ${empresa.ativo !== false ? 'badge-success' : 'badge-error'}`}>
                            {empresa.ativo !== false ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td>
                          <div className="flex justify-end gap-1">
                            <button className="btn btn-ghost btn-sm btn-square" onClick={() => openEditEmpresaModal(empresa)} title="Editar">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10" onClick={() => { setDeletingEmpresaId(empresa.id); setIsDeleteEmpresaDialogOpen(true); }} title="Excluir">
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
                <p className="text-sm text-base-content/50">{filteredEmpresas.length} empresa(s)</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Lista de Estabelecimentos */}
      {subTab === 'estabelecimentos' && (
        <>
          {filteredEstabelecimentos.length === 0 ? (
            <div className="glass-card p-8">
              <EmptyState
                title={searchTerm ? "Nenhum resultado" : "Nenhum estabelecimento"}
                description={searchTerm ? "Tente outro termo" : "Clique em 'Novo Estabelecimento'"}
                icon="🏭"
              />
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="bg-base-200/30">
                    <tr className="text-base-content/60 uppercase text-xs">
                      <th>Codigo</th>
                      <th>Nome</th>
                      <th>Empresa</th>
                      <th className="text-center">Status</th>
                      <th className="text-right">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEstabelecimentos.map((estabelecimento) => (
                      <tr key={estabelecimento.id} className="hover:bg-base-200/20 transition-colors">
                        <td className="font-mono font-semibold">{estabelecimento.cod_estabel}</td>
                        <td className="font-semibold">{estabelecimento.nome}</td>
                        <td>
                          <span className="badge badge-outline">
                            {estabelecimento.empresa?.cod_empresa} - {estabelecimento.empresa?.nome}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`badge ${estabelecimento.ativo !== false ? 'badge-success' : 'badge-error'}`}>
                            {estabelecimento.ativo !== false ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td>
                          <div className="flex justify-end gap-1">
                            <button className="btn btn-ghost btn-sm btn-square" onClick={() => openEditEstabelecimentoModal(estabelecimento)} title="Editar">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10" onClick={() => { setDeletingEstabelecimentoId(estabelecimento.id); setIsDeleteEstabelecimentoDialogOpen(true); }} title="Excluir">
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
                <p className="text-sm text-base-content/50">{filteredEstabelecimentos.length} estabelecimento(s)</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Empresa */}
      <Modal
        isOpen={isEmpresaModalOpen}
        onClose={() => setIsEmpresaModalOpen(false)}
        title={editingEmpresaId ? 'Editar Empresa' : 'Nova Empresa'}
        size="sm"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setIsEmpresaModalOpen(false)} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleEmpresaSubmit} disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Salvar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Codigo da Empresa" required>
            <input type="text" className="input input-bordered w-full" value={empresaForm.cod_empresa} onChange={(e) => setEmpresaForm({ ...empresaForm, cod_empresa: e.target.value })} placeholder="Ex: 01" autoFocus />
          </FormField>
          <FormField label="Nome da Empresa" required>
            <input type="text" className="input input-bordered w-full" value={empresaForm.nome} onChange={(e) => setEmpresaForm({ ...empresaForm, nome: e.target.value })} placeholder="Ex: PROMA BRASIL" />
          </FormField>
        </div>
      </Modal>

      {/* Modal Estabelecimento */}
      <Modal
        isOpen={isEstabelecimentoModalOpen}
        onClose={() => setIsEstabelecimentoModalOpen(false)}
        title={editingEstabelecimentoId ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
        size="sm"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setIsEstabelecimentoModalOpen(false)} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleEstabelecimentoSubmit} disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Salvar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Empresa" required>
            <select className="select select-bordered w-full" value={estabelecimentoForm.empresa} onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, empresa: e.target.value })}>
              <option value="">Selecione uma empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>{empresa.cod_empresa} - {empresa.nome}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Codigo do Estabelecimento" required>
            <input type="text" className="input input-bordered w-full" value={estabelecimentoForm.cod_estabel} onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, cod_estabel: e.target.value })} placeholder="Ex: 01" />
          </FormField>
          <FormField label="Nome do Estabelecimento" required>
            <input type="text" className="input input-bordered w-full" value={estabelecimentoForm.nome} onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, nome: e.target.value })} placeholder="Ex: PROMA CONTAGEM" />
          </FormField>
        </div>
      </Modal>

      {/* Confirmacao Exclusao Empresa */}
      <ConfirmDialog
        isOpen={isDeleteEmpresaDialogOpen}
        onClose={() => setIsDeleteEmpresaDialogOpen(false)}
        onConfirm={handleDeleteEmpresa}
        title="Excluir Empresa"
        message="Tem certeza que deseja excluir esta empresa? Todos os estabelecimentos vinculados tambem serao excluidos."
        confirmText="Excluir"
        variant="error"
      />

      {/* Confirmacao Exclusao Estabelecimento */}
      <ConfirmDialog
        isOpen={isDeleteEstabelecimentoDialogOpen}
        onClose={() => setIsDeleteEstabelecimentoDialogOpen(false)}
        onConfirm={handleDeleteEstabelecimento}
        title="Excluir Estabelecimento"
        message="Tem certeza que deseja excluir este estabelecimento?"
        confirmText="Excluir"
        variant="error"
      />
    </>
  );
}
