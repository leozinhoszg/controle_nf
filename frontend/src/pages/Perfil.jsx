import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { meuPerfilAPI } from '../services/api';
import { FormField, FormRow } from '../components/ui/Modal';
import Loading from '../components/ui/Loading';
import Toast from '../components/ui/Toast';
import ImageCropper from '../components/ui/ImageCropper';
import { useToast } from '../hooks/useToast';

export default function Perfil() {
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const fileInputRef = useRef(null);
  const { toast, showToast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    email: ''
  });
  const [senhaData, setSenhaData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    atual: false,
    nova: false,
    confirmar: false
  });
  const [senhaAlteradaSucesso, setSenhaAlteradaSucesso] = useState(false);

  // Estado do cropper de imagem
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  // Estado da verificação de email
  const [showVerificacaoModal, setShowVerificacaoModal] = useState(false);
  const [codigoOtp, setCodigoOtp] = useState('');
  const [enviandoOtp, setEnviandoOtp] = useState(false);
  const [verificandoOtp, setVerificandoOtp] = useState(false);
  const [otpEnviado, setOtpEnviado] = useState(false);

  useEffect(() => {
    loadPerfil();
  }, []);

  const loadPerfil = async () => {
    try {
      setLoading(true);
      const response = await meuPerfilAPI.get();
      setPerfil(response.data);
      setFormData({
        nome: response.data.nome || '',
        email: response.data.email || ''
      });
    } catch (error) {
      showToast('Erro ao carregar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await meuPerfilAPI.update(formData);
      setPerfil(prev => ({ ...prev, ...response.data.user }));

      // Atualizar contexto de autenticação
      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      const userData = JSON.parse(storage.getItem('user'));
      const updatedUser = { ...userData, ...response.data.user };
      storage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      showToast('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Erro ao atualizar perfil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (senhaData.novaSenha !== senhaData.confirmarSenha) {
      showToast('As senhas não coincidem', 'error');
      return;
    }

    if (senhaData.novaSenha.length < 6) {
      showToast('A nova senha deve ter no mínimo 6 caracteres', 'error');
      return;
    }

    try {
      setSaving(true);
      await meuPerfilAPI.changePassword(senhaData.senhaAtual, senhaData.novaSenha);
      setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      setShowPasswords({ atual: false, nova: false, confirmar: false });
      setSenhaAlteradaSucesso(true);
      showToast('Senha alterada com sucesso!', 'success');

      // Esconder aviso após 10 segundos
      setTimeout(() => setSenhaAlteradaSucesso(false), 10000);
    } catch (error) {
      showToast(error.response?.data?.message || 'Erro ao alterar senha', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Calcular força da senha
  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, label: '', class: '' };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: 33, label: 'Fraca', class: 'progress-error text-error' };
    if (strength <= 3) return { level: 66, label: 'Média', class: 'progress-warning text-warning' };
    return { level: 100, label: 'Forte', class: 'progress-success text-success' };
  };

  const passwordStrength = getPasswordStrength(senhaData.novaSenha);
  const senhasConferem = senhaData.confirmarSenha && senhaData.novaSenha === senhaData.confirmarSenha;

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Selecione apenas imagens', 'error');
      return;
    }

    // Limite aumentado para 5MB pois o cropper vai comprimir
    if (file.size > 5 * 1024 * 1024) {
      showToast('Imagem muito grande. Máximo 5MB.', 'error');
      return;
    }

    // Ler a imagem e abrir o cropper
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageToCrop(event.target.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);

    // Limpar input para permitir selecionar a mesma imagem novamente
    e.target.value = '';
  };

  const handleCropSave = async (croppedImage) => {
    setShowCropper(false);
    setImageToCrop(null);

    try {
      setSaving(true);
      const response = await meuPerfilAPI.updateFoto(croppedImage);
      setPerfil(prev => ({ ...prev, fotoPerfil: response.data.fotoPerfil }));

      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      const userData = JSON.parse(storage.getItem('user'));
      const updatedUser = { ...userData, fotoPerfil: response.data.fotoPerfil };
      storage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      showToast('Foto atualizada com sucesso!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Erro ao atualizar foto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
  };

  const handleRemovePhoto = async () => {
    try {
      setSaving(true);
      await meuPerfilAPI.updateFoto(null);
      setPerfil(prev => ({ ...prev, fotoPerfil: null }));

      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      const userData = JSON.parse(storage.getItem('user'));
      const updatedUser = { ...userData, fotoPerfil: null };
      storage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      showToast('Foto removida com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao remover foto', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Funções de verificação de email
  const handleSolicitarVerificacao = async () => {
    try {
      setEnviandoOtp(true);
      await meuPerfilAPI.solicitarVerificacaoEmail();
      setOtpEnviado(true);
      setShowVerificacaoModal(true);
      showToast('Código enviado para seu email!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Erro ao enviar código', 'error');
    } finally {
      setEnviandoOtp(false);
    }
  };

  const handleVerificarOtp = async (e) => {
    e.preventDefault();

    if (!codigoOtp || codigoOtp.length !== 6) {
      showToast('Digite o código de 6 dígitos', 'error');
      return;
    }

    try {
      setVerificandoOtp(true);
      await meuPerfilAPI.verificarEmailOtp(codigoOtp);

      // Atualizar estado local e contexto
      setPerfil(prev => ({ ...prev, emailVerificado: true }));
      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      const userData = JSON.parse(storage.getItem('user'));
      const updatedUser = { ...userData, emailVerificado: true };
      storage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setShowVerificacaoModal(false);
      setCodigoOtp('');
      setOtpEnviado(false);
      showToast('Email verificado com sucesso!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Código inválido ou expirado', 'error');
    } finally {
      setVerificandoOtp(false);
    }
  };

  const handleReenviarOtp = async () => {
    try {
      setEnviandoOtp(true);
      await meuPerfilAPI.solicitarVerificacaoEmail();
      showToast('Novo código enviado!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Erro ao reenviar código', 'error');
    } finally {
      setEnviandoOtp(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Loading text="Carregando perfil..." />;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gradient">Meu Perfil</h1>
        <p className="text-base-content/50 text-sm mt-1">Gerencie suas informações pessoais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna da Foto e Informações */}
        <div className="space-y-6">
          {/* Card da Foto */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Foto de Perfil</h2>

            <div className="flex flex-col items-center">
              <div
                className="relative group cursor-pointer"
                onClick={handlePhotoClick}
              >
                {perfil?.fotoPerfil ? (
                  <img
                    src={perfil.fotoPerfil}
                    alt="Foto de perfil"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                    <span className="text-4xl font-bold text-primary">
                      {perfil?.usuario?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handlePhotoClick}
                  className="btn btn-sm btn-primary"
                  disabled={saving}
                >
                  Alterar
                </button>
                {perfil?.fotoPerfil && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="btn btn-sm btn-ghost text-error"
                    disabled={saving}
                  >
                    Remover
                  </button>
                )}
              </div>
              <p className="text-xs text-base-content/50 mt-2">JPG, PNG. Máx 5MB</p>
            </div>
          </div>

          {/* Card de Informações da Conta */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Informações da Conta</h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide">Usuário</p>
                <p className="font-medium mt-1">{perfil?.usuario}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide">Perfil de Acesso</p>
                <div className="mt-1">
                  {perfil?.perfil ? (
                    <span className={`badge ${perfil.perfil.isAdmin ? 'badge-warning' : 'badge-primary'} gap-1`}>
                      {perfil.perfil.isAdmin && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      )}
                      {perfil.perfil.nome}
                    </span>
                  ) : (
                    <span className="badge badge-ghost">Sem perfil atribuído</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide">Conta criada em</p>
                <p className="font-medium mt-1">{formatDate(perfil?.createdAt)}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide">Último login</p>
                <p className="font-medium mt-1">{formatDate(perfil?.ultimoLogin)}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide">Email verificado</p>
                <div className="mt-1">
                  {perfil?.emailVerificado ? (
                    <span className="text-success flex items-center gap-1 font-medium">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Verificado
                    </span>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-warning flex items-center gap-1 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Não verificado
                      </span>
                      <button
                        type="button"
                        onClick={handleSolicitarVerificacao}
                        className="btn btn-sm btn-primary w-full"
                        disabled={enviandoOtp}
                      >
                        {enviandoOtp ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Verificar email
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna dos Formulários */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulário de Dados Pessoais */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-6">Dados Pessoais</h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <FormRow>
                <FormField label="Nome completo">
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="input input-bordered w-full"
                    placeholder="Seu nome completo"
                  />
                </FormField>

                <FormField label="Email" required>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input input-bordered w-full"
                    required
                  />
                </FormField>
              </FormRow>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="btn btn-primary shadow-soft"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Salvando...
                    </>
                  ) : (
                    'Salvar alterações'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Formulário de Alteração de Senha */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-lg font-semibold">Alterar Senha</h2>
            </div>
            <p className="text-sm text-base-content/60 mb-6">
              Por segurança, confirme sua senha atual para alterá-la.
            </p>

            {/* Aviso de sucesso */}
            {senhaAlteradaSucesso && (
              <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-success">Senha alterada com sucesso!</p>
                    <p className="text-sm text-base-content/60 mt-1">
                      Se você não reconhece esta alteração, entre em contato com o administrador imediatamente.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <FormField label="Senha atual" required>
                <div className="relative">
                  <input
                    type={showPasswords.atual ? 'text' : 'password'}
                    value={senhaData.senhaAtual}
                    onChange={(e) => setSenhaData(prev => ({ ...prev, senhaAtual: e.target.value }))}
                    className="input input-bordered w-full pr-12"
                    placeholder="Digite sua senha atual"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                    onClick={() => setShowPasswords(prev => ({ ...prev, atual: !prev.atual }))}
                    tabIndex={-1}
                  >
                    {showPasswords.atual ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </FormField>

              <FormRow>
                <FormField label="Nova senha" required>
                  <div className="relative">
                    <input
                      type={showPasswords.nova ? 'text' : 'password'}
                      value={senhaData.novaSenha}
                      onChange={(e) => setSenhaData(prev => ({ ...prev, novaSenha: e.target.value }))}
                      className="input input-bordered w-full pr-12"
                      placeholder="Digite a nova senha"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                      onClick={() => setShowPasswords(prev => ({ ...prev, nova: !prev.nova }))}
                      tabIndex={-1}
                    >
                      {showPasswords.nova ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Indicador de força da senha */}
                  {senhaData.novaSenha && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-base-content/60">Força da senha:</span>
                        <span className={`text-xs font-medium ${passwordStrength.class.split(' ')[1]}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <progress
                        className={`progress ${passwordStrength.class.split(' ')[0]} w-full h-1.5`}
                        value={passwordStrength.level}
                        max="100"
                      />
                    </div>
                  )}
                  <p className="text-xs text-base-content/50 mt-1">Mínimo 6 caracteres</p>
                </FormField>

                <FormField label="Confirmar nova senha" required>
                  <div className="relative">
                    <input
                      type={showPasswords.confirmar ? 'text' : 'password'}
                      value={senhaData.confirmarSenha}
                      onChange={(e) => setSenhaData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                      className={`input input-bordered w-full pr-12 ${
                        senhaData.confirmarSenha
                          ? senhasConferem
                            ? 'border-success'
                            : 'border-error'
                          : ''
                      }`}
                      placeholder="Confirme a nova senha"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirmar: !prev.confirmar }))}
                      tabIndex={-1}
                    >
                      {showPasswords.confirmar ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Feedback de confirmação */}
                  {senhaData.confirmarSenha && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${senhasConferem ? 'text-success' : 'text-error'}`}>
                      {senhasConferem ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Senhas conferem
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          As senhas não coincidem
                        </>
                      )}
                    </p>
                  )}
                </FormField>
              </FormRow>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="btn btn-warning gap-2"
                  disabled={saving || (senhaData.confirmarSenha && !senhasConferem)}
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Alterando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Alterar senha
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {toast && <Toast toasts={[toast]} />}

      {/* Image Cropper Modal */}
      {showCropper && imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          onSave={handleCropSave}
          onCancel={handleCropCancel}
          outputSize={300}
          outputFormat="image/jpeg"
          quality={0.85}
        />
      )}

      {/* Modal de Verificação de Email */}
      {showVerificacaoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-primary/10 px-6 py-4 border-b border-base-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Verificar Email</h3>
                  <p className="text-sm text-base-content/60">Digite o código enviado</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleVerificarOtp} className="p-6">
              <div className="text-center mb-6">
                <p className="text-base-content/70">
                  Enviamos um código de 6 dígitos para:
                </p>
                <p className="font-semibold text-primary mt-1">{perfil?.email}</p>
              </div>

              {/* Input do código OTP */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-center">
                  Código de verificação
                </label>
                <input
                  type="text"
                  value={codigoOtp}
                  onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input input-bordered w-full text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-base-content/50 text-center mt-2">
                  O código expira em 15 minutos
                </p>
              </div>

              {/* Botões */}
              <div className="space-y-3">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={verificandoOtp || codigoOtp.length !== 6}
                >
                  {verificandoOtp ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Verificar
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleReenviarOtp}
                    className="btn btn-ghost btn-sm"
                    disabled={enviandoOtp}
                  >
                    {enviandoOtp ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      'Reenviar código'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowVerificacaoModal(false);
                      setCodigoOtp('');
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
