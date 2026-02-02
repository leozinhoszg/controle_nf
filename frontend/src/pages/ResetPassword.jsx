import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import ThemeToggle from '../components/ui/ThemeToggle';
import loginBg from '../assets/login.png';
import logo from '../assets/PROMA 6.2.png';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(!token);

  const getPasswordStrength = (password) => {
    if (!password) return { class: '', width: 0, label: '' };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { class: 'progress-error', width: 33, label: 'Fraca', textClass: 'text-error' };
    if (strength <= 3) return { class: 'progress-warning', width: 66, label: 'Média', textClass: 'text-warning' };
    return { class: 'progress-success', width: 100, label: 'Forte', textClass: 'text-success' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não conferem');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, senha);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login?msg=senha_alterada');
      }, 2000);
    } catch (err) {
      if (err.response?.status === 400) {
        setInvalidToken(true);
      } else {
        setError(err.response?.data?.message || 'Erro ao redefinir senha');
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(senha);

  // Token inválido
  if (invalidToken) {
    return (
      <div className="min-h-screen flex bg-base-100">
        {/* Theme Toggle */}
        <div className="fixed top-6 right-6 z-50">
          <ThemeToggle className="btn-circle glass-card shadow-lg" />
        </div>

        {/* Left Side - Image Background */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <img
            src={loginBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
            <div className="max-w-md text-center">
              <div className="flex items-center justify-center gap-4 mb-8">
                <img src={logo} alt="PROMA" className="h-24" />
                <span className="text-5xl font-bold tracking-tight drop-shadow-lg logo-font">PROMA SIGMA</span>
              </div>
              <p className="text-white/80 text-lg leading-relaxed drop-shadow">
                Sistema de gestão e monitoramento de contratos com fornecedores
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Error */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-base-100 border-l-4 border-primary/20">
          <div className="w-full max-w-md animate-fadeInUp text-center">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
                <img src={logo} alt="PROMA" className="h-9" />
              </div>
              <span className="text-2xl font-bold text-primary logo-font">PROMA SIGMA</span>
            </div>

            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-error/10 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-error mb-3">Link inválido ou expirado</h2>
            <p className="text-base-content/60 mb-8 leading-relaxed">
              O link de redefinição de senha é inválido ou já expirou.
              Solicite um novo link para recuperar sua senha.
            </p>

            <Link
              to="/esqueci-senha"
              className="btn btn-primary w-full h-12 text-base font-medium rounded-xl"
            >
              Solicitar novo link
            </Link>

            <p className="text-center text-sm text-base-content/60 mt-8">
              <Link to="/login" className="font-medium text-primary hover:underline">
                Voltar ao login
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Sucesso
  if (success) {
    return (
      <div className="min-h-screen flex bg-base-100">
        {/* Theme Toggle */}
        <div className="fixed top-6 right-6 z-50">
          <ThemeToggle className="btn-circle glass-card shadow-lg" />
        </div>

        {/* Left Side - Image Background */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <img
            src={loginBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
            <div className="max-w-md text-center">
              <div className="flex items-center justify-center gap-4 mb-8">
                <img src={logo} alt="PROMA" className="h-24" />
                <span className="text-5xl font-bold tracking-tight drop-shadow-lg logo-font">PROMA SIGMA</span>
              </div>
              <p className="text-white/80 text-lg leading-relaxed drop-shadow">
                Sistema de gestão e monitoramento de contratos com fornecedores
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Success */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-base-100 border-l-4 border-primary/20">
          <div className="w-full max-w-md animate-fadeInUp text-center">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
                <img src={logo} alt="PROMA" className="h-9" />
              </div>
              <span className="text-2xl font-bold text-primary logo-font">PROMA SIGMA</span>
            </div>

            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-success mb-3">Senha alterada com sucesso!</h2>
            <p className="text-base-content/60 mb-6 leading-relaxed">
              Sua senha foi redefinida. Você será redirecionado para a página de login.
            </p>

            <span className="loading loading-dots loading-lg text-primary"></span>
          </div>
        </div>
      </div>
    );
  }

  // Formulário
  return (
    <div className="min-h-screen flex bg-base-100">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle className="btn-circle glass-card shadow-lg" />
      </div>

      {/* Left Side - Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <img
          src={loginBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="max-w-md text-center">
            {/* Logo */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <img src={logo} alt="PROMA" className="h-24" />
              <span className="text-5xl font-bold tracking-tight drop-shadow-lg logo-font">PROMA SIGMA</span>
            </div>
            <p className="text-white/80 text-lg leading-relaxed drop-shadow">
              Crie uma nova senha segura para proteger sua conta
            </p>

            {/* Security Tips */}
            <div className="mt-12 space-y-4 text-left">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-sm">Use no mínimo 6 caracteres</span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-sm">Combine letras, números e símbolos</span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <span className="text-sm">Evite senhas óbvias ou repetidas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-base-100 border-l-4 border-primary/20">
        <div className="w-full max-w-md animate-fadeInUp">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
              <img src={logo} alt="PROMA" className="h-9" />
            </div>
            <span className="text-2xl font-bold text-primary logo-font">PROMA SIGMA</span>
          </div>

          {/* Back Link */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-base-content/60 hover:text-base-content transition-colors mb-6 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao login
          </Link>

          {/* Title */}
          <h1 className="text-3xl font-bold text-base-content mb-2">Redefinir Senha</h1>
          <p className="text-base-content/60 mb-8">
            Digite sua nova senha abaixo
          </p>

          {/* Erro */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-error shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm text-error">{error}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Nova senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input input-bordered w-full pr-12 h-12 bg-base-100 border-base-300 focus:border-primary focus:outline-none"
                  placeholder="Digite sua nova senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Barra de força da senha */}
              {senha && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-base-content/60">Força da senha:</span>
                    <span className={`text-xs font-medium ${strength.textClass}`}>{strength.label}</span>
                  </div>
                  <progress className={`progress ${strength.class} w-full h-2`} value={strength.width} max="100"></progress>
                </div>
              )}
              <p className="text-xs text-base-content/50 mt-2">Mínimo de 6 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Confirmar nova senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input input-bordered w-full h-12 bg-base-100 border-base-300 focus:border-primary focus:outline-none"
                placeholder="Confirme sua nova senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
              />
              {confirmarSenha && senha !== confirmarSenha && (
                <p className="text-xs text-error mt-2">As senhas não conferem</p>
              )}
              {confirmarSenha && senha === confirmarSenha && (
                <p className="text-xs text-success mt-2 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Senhas conferem
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full h-12 text-base font-medium rounded-xl"
              disabled={loading || senha !== confirmarSenha}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Redefinir senha'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-base-content/60 mt-8">
            PROMA SIGMA &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
