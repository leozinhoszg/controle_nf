import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import ThemeToggle from '../components/ui/ThemeToggle';
import loginBg from '../assets/login.png';
import logo from '../assets/PROMA 6.2.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Digite seu email');
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      // Por segurança, mostramos sucesso mesmo se email não existir
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

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
              Não se preocupe, vamos ajudá-lo a recuperar o acesso à sua conta
            </p>

            {/* Security Info */}
            <div className="mt-12 space-y-4 text-left">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm">Receba um link seguro por email</span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm">Link válido por 1 hora</span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-sm">Processo seguro e criptografado</span>
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

          {!sent ? (
            <>
              {/* Title */}
              <h1 className="text-3xl font-bold text-base-content mb-2">Recuperar Senha</h1>
              <p className="text-base-content/60 mb-8">
                Digite seu email cadastrado e enviaremos instruções para redefinir sua senha
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
                    Email
                  </label>
                  <input
                    type="email"
                    className="input input-bordered w-full h-12 bg-base-100 border-base-300 focus:border-primary focus:outline-none"
                    placeholder="nome@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full h-12 text-base font-medium rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-base-content/60 mt-8">
                Lembrou a senha?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Fazer login
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center">
              {/* Success Icon */}
              <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-base-content mb-2">Email enviado!</h2>
              <p className="text-base-content/60 mb-8 leading-relaxed">
                Se o email <span className="font-medium text-base-content">{email}</span> existir em nosso sistema, você receberá um link para redefinir sua senha.
              </p>

              {/* Info Box */}
              <div className="p-4 rounded-xl bg-info/10 border border-info/20 text-left mb-8">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-info shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-info mb-1">Verifique sua caixa de entrada</p>
                    <p className="text-xs text-base-content/60">
                      Se não encontrar o email, verifique também a pasta de spam.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/login"
                className="btn btn-primary w-full h-12 text-base font-medium rounded-xl"
              >
                Voltar ao login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
