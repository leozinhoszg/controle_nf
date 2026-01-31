import { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import navBg from '../../assets/nav.png';
import logo from '../../assets/PROMA 6.2.png';

// Itens de navegação com suas permissões necessárias
const allNavItems = [
  { path: '/', label: 'Dashboard', permissao: 'dashboard' },
  { path: '/fornecedores', label: 'Fornecedores', permissao: 'fornecedores' },
  { path: '/contratos', label: 'Contratos', permissao: 'contratos' },
  { path: '/relatorio', label: 'Relatório', permissao: 'relatorio' },
  { path: '/usuarios', label: 'Usuários', permissao: 'usuarios' },
  { path: '/perfis', label: 'Perfis', permissao: 'perfis' }
];

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  // Filtrar itens de navegação baseado nas permissões do usuário
  const navItems = useMemo(() => {
    const perfil = usuario?.perfil;

    // Se não tem perfil, mostrar apenas dashboard
    if (!perfil) {
      return allNavItems.filter(item => item.permissao === 'dashboard');
    }

    // Se é admin, mostrar tudo
    if (perfil.isAdmin) {
      return allNavItems;
    }

    // Filtrar baseado nas permissões do perfil
    const permissoes = perfil.permissoes || [];
    return allNavItems.filter(item => permissoes.includes(item.permissao));
  }, [usuario?.perfil]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navbar */}
      <nav className="relative">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={navBg}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Navbar Content */}
        <div className="relative z-10 px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="PROMA" className="h-10 w-auto" />
              <span className="text-white font-bold text-xl tracking-wide">PROMA SIGMA</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle className="text-white/80 hover:text-white hover:bg-white/10" />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                    <span className="text-sm font-semibold text-white">
                      {usuario?.usuario?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-white text-sm font-medium hidden sm:block">
                    {usuario?.usuario || 'Usuário'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-base-100 rounded-xl shadow-lg border border-base-300 py-2 z-20">
                      <div className="px-4 py-2 border-b border-base-200">
                        <p className="text-sm font-medium text-base-content">{usuario?.usuario || 'Usuário'}</p>
                        <p className="text-xs text-base-content/60 capitalize">{usuario?.perfil?.nome || 'Sem perfil'}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4">
              <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.path)
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto animate-fadeIn">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 text-center text-sm text-base-content/50">
        PROMA SIGMA - {new Date().getFullYear()}
      </footer>
    </div>
  );
}
