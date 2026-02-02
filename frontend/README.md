# PROMA SIGMA - Frontend

Frontend da aplicação PROMA SIGMA, um sistema de gestão de contratos e medições de fornecedores com sincronização automática com ERP (Datasul).

## Stack Tecnológico

- **React 18** - Biblioteca UI
- **Vite** - Build tool e dev server
- **React Router DOM** - Roteamento SPA
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Framework CSS utility-first
- **DaisyUI** - Componentes UI para Tailwind
- **Recharts** - Gráficos e visualizações

## Requisitos

- Node.js 16+
- npm ou yarn
- Backend rodando (ver `/server/README.md`)

## Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente (se necessário)
# O proxy para o backend está configurado no vite.config.js
```

## Scripts de Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento (porta 5173)
npm run dev

# Build para produção (output em /dist)
npm run build

# Preview do build de produção
npm run preview

# Executar linter
npm run lint
```

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── layout/         # Layout e navegação
│   ├── ProtectedRoute.jsx
│   └── ProtectedPermission.jsx
├── context/            # Context API (AuthContext)
├── hooks/              # Custom hooks (useToast)
├── pages/              # Componentes de rota
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Fornecedores.jsx
│   ├── Contratos.jsx
│   ├── RelatorioMensal.jsx
│   ├── Perfil.jsx
│   └── Configuracoes/
├── services/           # API e serviços
│   └── api.js         # Cliente axios com interceptors
└── utils/              # Funções auxiliares
```

## Rotas da Aplicação

### Rotas Públicas
- `/login` - Autenticação de usuários
- `/esqueci-senha` - Solicitação de reset de senha
- `/reset-senha/:token` - Redefinição de senha com token

### Rotas Protegidas
- `/` - Dashboard (visão geral de contratos e medições)
- `/perfil` - Perfil do usuário
- `/fornecedores` - Gestão de fornecedores (requer permissão `fornecedores`)
- `/contratos` - Gestão de contratos (requer permissão `contratos`)
- `/relatorio` - Relatório mensal (requer permissão `relatorio`)
- `/configuracoes` - Configurações do sistema (múltiplas permissões)

## Autenticação

O sistema utiliza JWT (JSON Web Tokens) com refresh tokens:

1. **Login**: POST `/api/auth/login` retorna access token + refresh token
2. **Access Token**: Armazenado em `localStorage`, enviado no header `Authorization: Bearer <token>`
3. **Refresh Token**: Armazenado em `localStorage`, usado para renovar access token
4. **Auto-Refresh**: Interceptor axios renova token automaticamente em 401

### AuthContext

Gerencia estado global de autenticação:
```javascript
const { user, login, logout, isAuthenticated } = useAuth();
```

## Integração com Backend

### Cliente API (services/api.js)

Instância axios configurada com:
- Base URL do backend
- Interceptor de request (adiciona Authorization header)
- Interceptor de response (auto-refresh em 401)
- Tratamento de erros centralizado

```javascript
import api from '../services/api';

// Exemplo de uso
const response = await api.get('/fornecedores');
const data = await api.post('/contratos', contratoData);
```

### Endpoints Principais

- `/api/auth/*` - Autenticação
- `/api/fornecedores` - CRUD de fornecedores
- `/api/contratos` - CRUD de contratos
- `/api/sequencias` - CRUD de sequências (itens de contrato)
- `/api/medicoes` - Consulta e sincronização de medições ERP
- `/api/usuarios` - Gestão de usuários
- `/api/perfis` - Gestão de perfis e permissões
- `/api/auditoria` - Logs de auditoria

## Controle de Acesso

### ProtectedRoute
Protege rotas que requerem autenticação:
```jsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### ProtectedPermission
Protege componentes que requerem permissões específicas:
```jsx
<ProtectedPermission permission="fornecedores">
  <BotaoNovoFornecedor />
</ProtectedPermission>
```

### Permissões Disponíveis
- `dashboard` - Acesso ao dashboard
- `fornecedores` - Gestão de fornecedores
- `contratos` - Gestão de contratos
- `relatorio` - Visualização de relatórios
- `usuarios` - Gestão de usuários
- `perfis` - Gestão de perfis e permissões
- `auditoria` - Visualização de logs de auditoria

**Nota**: Usuários com `perfil.isAdmin = true` têm acesso a tudo.

## Temas e Estilos

### Tailwind CSS + DaisyUI

Configurado em `tailwind.config.js`:
- Temas DaisyUI disponíveis
- Classes utilitárias customizadas
- Responsividade mobile-first

### Toast Notifications

Hook customizado `useToast()`:
```javascript
const toast = useToast();
toast.success('Operação realizada com sucesso!');
toast.error('Erro ao processar solicitação');
toast.info('Informação importante');
```

## Desenvolvimento

### Proxy de Desenvolvimento

O Vite está configurado para fazer proxy de requisições `/api/*` para o backend (porta 3001):

```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true
  }
}
```

### Hot Module Replacement (HMR)

Vite oferece HMR automático durante desenvolvimento. Mudanças no código são refletidas instantaneamente no browser sem reload completo.

### ESLint

Configuração em `.eslintrc.cjs` com regras para React:
```bash
npm run lint          # Verificar problemas
npm run lint -- --fix # Corrigir automaticamente
```

## Build para Produção

```bash
# Build otimizado
npm run build

# Output gerado em /dist
# Arquivos estáticos servidos pelo backend Express
```

O backend serve automaticamente os arquivos do `/frontend/dist` quando em produção, funcionando como uma SPA única porta.

## Funcionalidades Principais

### Dashboard
- Visão geral de contratos ativos
- Estatísticas de medições
- Alertas de sequências atrasadas
- Gráficos de desempenho

### Gestão de Fornecedores
- CRUD completo
- Filtros e busca
- Visualização de contratos associados

### Gestão de Contratos
- CRUD de contratos e sequências
- Status mensal automático
- Sincronização com ERP Datasul
- Alertas de valor divergente
- Histórico de medições

### Relatório Mensal
- Filtros por período, fornecedor, contrato
- Exportação de dados
- Visualizações gráficas

### Configurações
- Gestão de usuários e permissões
- Gestão de perfis
- Logs de auditoria
- Estatísticas do sistema

## Tratamento de Erros

O cliente API possui tratamento centralizado:
- Erros 401: Auto-refresh de token ou redirect para login
- Erros 403: Mensagem de acesso negado
- Erros 500: Mensagem genérica de erro do servidor
- Erros de rede: Mensagem de conexão falha

## Considerações de Segurança

- Tokens JWT nunca expostos na URL
- Refresh automático de tokens
- Logout limpa todo localStorage
- Proteção de rotas no frontend (validação real no backend)
- CSP headers configurados (via backend)

## Solução de Problemas

### Erro de CORS
Verifique se o backend está rodando e se o proxy está configurado corretamente.

### Token expirado constantemente
Verifique sincronização de horário do servidor/cliente e configuração JWT_EXPIRES_IN no backend.

### Componentes não renderizam
Verifique console do browser, pode ser erro de permissão ou dados ausentes da API.

## Roadmap

- [ ] Testes unitários (Jest + React Testing Library)
- [ ] Testes E2E (Playwright)
- [ ] TypeScript migration
- [ ] PWA support
- [ ] Internacionalização (i18n)

## Suporte

Para problemas ou dúvidas:
1. Verifique documentação do projeto (`/CLAUDE.md`)
2. Consulte logs do backend
3. Revise logs de auditoria no painel de configurações

## Licença

Proprietary - PROMA SIGMA
