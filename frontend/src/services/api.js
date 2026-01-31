import axios from 'axios';

// Usa variável de ambiente em produção, proxy em desenvolvimento
const baseURL = import.meta.env.VITE_API_URL || '/api';
const timeout = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

const api = axios.create({
  baseURL,
  timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para lidar com erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se token expirou e não é uma retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh-token', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          // Atualizar tokens
          const storage = localStorage.getItem('accessToken') ? localStorage : sessionStorage;
          storage.setItem('accessToken', accessToken);
          storage.setItem('refreshToken', newRefreshToken);

          // Refazer requisição original
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Limpar auth e redirecionar para login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          sessionStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ==================== FORNECEDORES ====================
export const fornecedoresAPI = {
  getAll: () => api.get('/fornecedores'),
  getById: (id) => api.get(`/fornecedores/${id}`),
  create: (data) => api.post('/fornecedores', typeof data === 'string' ? { nome: data } : data),
  update: (id, data) => api.put(`/fornecedores/${id}`, typeof data === 'string' ? { nome: data } : data),
  delete: (id) => api.delete(`/fornecedores/${id}`),
  // Aliases em português
  listar: () => api.get('/fornecedores'),
  buscarPorId: (id) => api.get(`/fornecedores/${id}`),
  criar: (data) => api.post('/fornecedores', typeof data === 'string' ? { nome: data } : data),
  atualizar: (id, data) => api.put(`/fornecedores/${id}`, typeof data === 'string' ? { nome: data } : data),
  excluir: (id) => api.delete(`/fornecedores/${id}`)
};

// ==================== CONTRATOS ====================
export const contratosAPI = {
  getAll: (fornecedorId) => api.get('/contratos', { params: fornecedorId ? { fornecedor: fornecedorId } : {} }),
  getById: (id) => api.get(`/contratos/${id}`),
  create: (data) => api.post('/contratos', data),
  update: (id, data) => api.put(`/contratos/${id}`, data),
  delete: (id) => api.delete(`/contratos/${id}`),
  // Aliases em português
  listar: (fornecedorId) => api.get('/contratos', { params: fornecedorId ? { fornecedor: fornecedorId } : {} }),
  buscarPorId: (id) => api.get(`/contratos/${id}`),
  criar: (data) => api.post('/contratos', data),
  atualizar: (id, data) => api.put(`/contratos/${id}`, data),
  excluir: (id) => api.delete(`/contratos/${id}`)
};

// ==================== SEQUÊNCIAS ====================
export const sequenciasAPI = {
  getAll: (contratoId) => api.get('/sequencias', { params: contratoId ? { contrato: contratoId } : {} }),
  getById: (id) => api.get(`/sequencias/${id}`),
  create: (data) => api.post('/sequencias', data),
  update: (id, data) => api.put(`/sequencias/${id}`, data),
  updateStatus: (id, monthKey, status) => api.patch(`/sequencias/${id}/status`, { monthKey, status }),
  delete: (id) => api.delete(`/sequencias/${id}`),
  // Aliases em português
  listar: (contratoId) => api.get('/sequencias', { params: contratoId ? { contrato: contratoId } : {} }),
  listarPorContrato: (contratoId) => api.get('/sequencias', { params: { contrato: contratoId } }),
  buscarPorId: (id) => api.get(`/sequencias/${id}`),
  criar: (data) => api.post('/sequencias', data),
  atualizar: (id, data) => api.put(`/sequencias/${id}`, data),
  atualizarStatus: (id, monthKey, status) => api.patch(`/sequencias/${id}/status`, { monthKey, status }),
  excluir: (id) => api.delete(`/sequencias/${id}`)
};

// ==================== RELATÓRIO ====================
export const relatorioAPI = {
  getTabela: () => api.get('/relatorio/tabela'),
  getResumo: () => api.get('/relatorio/resumo'),
  loadSampleData: () => api.post('/relatorio/seed'),
  // Aliases em português - gerar retorna dados formatados para o relatório mensal
  gerar: (mesAno) => api.get('/relatorio/tabela', { params: mesAno ? { mesAno } : {} }),
  obterResumo: () => api.get('/relatorio/resumo'),
  carregarDadosExemplo: () => api.post('/relatorio/seed')
};

// ==================== MEDIÇÕES ====================
export const medicoesAPI = {
  getBySequencia: (id) => api.get(`/medicoes/sequencia/${id}`),
  buscar: (contrato, estabelecimento, sequencia) =>
    api.get('/medicoes/buscar', { params: { contrato, estabelecimento, sequencia } }),
  getStatus: (id) => api.get(`/medicoes/sequencia/${id}/status`),
  sincronizar: (id) => api.post(`/medicoes/sincronizar/${id}`),
  sincronizarTodas: () => api.post('/medicoes/sincronizar-todas'),
  getAlertas: () => api.get('/medicoes/alertas'),
  // Aliases em português
  listarPorSequencia: (id) => api.get(`/medicoes/sequencia/${id}`),
  obterStatus: (id) => api.get(`/medicoes/sequencia/${id}/status`),
  obterAlertas: () => api.get('/medicoes/alertas'),
  atualizar: (id, data) => api.put(`/medicoes/${id}`, data)
};

// ==================== USUÁRIOS ====================
export const usuariosAPI = {
  getAll: (params) => api.get('/usuarios', { params }),
  getById: (id) => api.get(`/usuarios/${id}`),
  create: (data) => api.post('/usuarios', data),
  update: (id, data) => api.put(`/usuarios/${id}`, data),
  delete: (id) => api.delete(`/usuarios/${id}`),
  alterarSenha: (id, novaSenha) => api.patch(`/usuarios/${id}/senha`, { novaSenha }),
  toggleAtivo: (id) => api.patch(`/usuarios/${id}/toggle-ativo`),
  // Aliases em português
  listar: (params) => api.get('/usuarios', { params }),
  buscarPorId: (id) => api.get(`/usuarios/${id}`),
  criar: (data) => api.post('/usuarios', data),
  atualizar: (id, data) => api.put(`/usuarios/${id}`, data),
  excluir: (id) => api.delete(`/usuarios/${id}`)
};

// ==================== PERFIS ====================
export const perfisAPI = {
  getAll: (params) => api.get('/perfis', { params }),
  getById: (id) => api.get(`/perfis/${id}`),
  create: (data) => api.post('/perfis', data),
  update: (id, data) => api.put(`/perfis/${id}`, data),
  delete: (id) => api.delete(`/perfis/${id}`),
  getPermissoes: () => api.get('/perfis/permissoes'),
  // Aliases em português
  listar: (params) => api.get('/perfis', { params }),
  buscarPorId: (id) => api.get(`/perfis/${id}`),
  criar: (data) => api.post('/perfis', data),
  atualizar: (id, data) => api.put(`/perfis/${id}`, data),
  excluir: (id) => api.delete(`/perfis/${id}`),
  listarPermissoes: () => api.get('/perfis/permissoes')
};
