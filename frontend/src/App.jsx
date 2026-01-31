import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
import Usuarios from './pages/Usuarios';
import Perfis from './pages/Perfis';

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
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/contratos" element={<Contratos />} />
            <Route path="/relatorio" element={<RelatorioMensal />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/perfis" element={<Perfis />} />
          </Route>

          {/* Redirecionar rotas desconhecidas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
