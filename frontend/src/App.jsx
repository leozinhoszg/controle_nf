import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedPermission from './components/ProtectedPermission';
import MainLayout from './components/layout/MainLayout';

// Pages - Auth
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Pages - Main
import Dashboard from './pages/Dashboard';
import Fornecedores from './pages/Fornecedores';
import Contratos from './pages/Contratos';
import RelatorioMensal from './pages/RelatorioMensal';
import Configuracoes from './pages/Configuracoes';
import Perfil from './pages/Perfil';

// Styles
import './index.css';

function App() {
  // Inicializar tema do localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/reset-senha/:token" element={<ResetPassword />} />

          {/* Rotas protegidas com layout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/fornecedores" element={
              <ProtectedPermission permissao="fornecedores">
                <Fornecedores />
              </ProtectedPermission>
            } />
            <Route path="/contratos" element={
              <ProtectedPermission permissao="contratos">
                <Contratos />
              </ProtectedPermission>
            } />
            <Route path="/relatorio" element={
              <ProtectedPermission permissao="relatorio">
                <RelatorioMensal />
              </ProtectedPermission>
            } />
            <Route path="/configuracoes" element={
              <ProtectedPermission permissao={['usuarios', 'perfis']}>
                <Configuracoes />
              </ProtectedPermission>
            } />
          </Route>

          {/* Redirecionar rotas desconhecidas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
