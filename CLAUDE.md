# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PROMA SIGMA is a full-stack contract management and measurement tracking system for monitoring supplier contracts, invoice measurements, and automated synchronization with an external ERP system (Datasul). Built with MERN stack (MongoDB, Express, React, Node.js).

## Development Commands

### Backend (server/)
```bash
cd server
npm run dev          # Start development server with nodemon (auto-reload)
npm start            # Start production server
npm run create-admin # Create initial admin user
```

### Frontend (frontend/)
```bash
cd frontend
npm run dev          # Start Vite dev server (port 5173, proxies to :3001)
npm run build        # Build for production (outputs to dist/)
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Full Application
Backend serves static frontend from `frontend/dist/` on a single port (default: 3000).
In development, run both servers separately: backend on port 3001, frontend dev on port 5173.

## Architecture

### Monorepo Structure
```
/server          # Backend API (Node.js + Express + MongoDB)
/frontend        # Frontend SPA (React + Vite + Tailwind + DaisyUI)
/js, /css        # Legacy static files (not used in current app)
index.html       # Legacy file (not used)
```

### Backend Architecture (`/server`)

**Key Directories:**
- `config/` - Database connection, JWT config, seed data
- `models/` - Mongoose schemas (User, Perfil, Contrato, Sequencia, Medicao, Fornecedor, AuditLog, RefreshToken, Webhook)
- `controllers/` - HTTP request handlers
- `services/` - Business logic (auditoria, email, medicoes, webhook)
- `routes/` - Express route definitions
- `middleware/` - Authentication, authorization, rate limiting
- `scripts/` - Database migration and seeding scripts

**Entry Point:** `server.js`
- Connects to MongoDB
- Auto-seeds data if DB is empty
- Serves static frontend from `../frontend/dist`
- Configures CORS, rate limiting, proxy trust
- All non-API routes serve `index.html` (SPA support)

### Frontend Architecture (`/frontend/src`)

**Key Directories:**
- `pages/` - Route components (Login, Dashboard, Fornecedores, Contratos, RelatorioMensal, Configuracoes, Perfil)
- `components/` - Reusable UI components, layout components, ProtectedRoute/ProtectedPermission wrappers
- `context/` - AuthContext for global authentication state
- `services/` - API layer (api.js with axios instance, automatic token refresh)
- `hooks/` - Custom React hooks (useToast)
- `utils/` - Helper functions

**Entry Point:** `main.jsx`
- Renders React Router app
- AuthProvider wraps entire application

**Routing:**
- `/login`, `/esqueci-senha`, `/reset-senha/:token` - Public routes
- `/` (Dashboard), `/perfil`, `/fornecedores`, `/contratos`, `/relatorio`, `/configuracoes` - Protected routes
- Uses `ProtectedRoute` and `ProtectedPermission` components for access control

## Data Model Relationships

```
User → Perfil (role-based permissions)
Fornecedor → Contrato (one-to-many)
Contrato → Sequencia (one-to-many, contract line items)
Sequencia → Medicao (one-to-many, measurements from ERP)
User → AuditLog (audit trail of all actions)
```

### Key Models

**Sequencia** - Contract line items with monthly tracking
- `diaEmissao` (1-31) - Day of month invoice should be issued
- `valor` - Expected monthly invoice value
- `statusMensal` - Map of status by month (e.g., `{"2026-01": "ok", "2026-02": "atrasada"}`)
- Possible status values: `ok`, `pendente`, `atrasada`, `atualizar_contrato`, `futuro`, `registrada`, `nao_registrada`

**Medicao** - Measurements synchronized from ERP API
- Stores invoice data from external Datasul system
- `statusRegistro` - Computed from ERP: `registrada` (invoice recorded), `nao_registrada` (pending), `pendente`
- `alertaValor` - Boolean flag if measurement value differs from sequence value
- Unique per: (nr-contrato, cod-estabel, num-seq-item, num-seq-medicao)

**AuditLog** - Comprehensive audit trail
- 15 action types, 9 categories, 4 severity levels
- Captures before/after data, changed fields, IP, user agent
- Auto-deletes after 365 days (TTL index)

## Authentication & Authorization

**Strategy:** JWT with refresh tokens
- Access tokens (short-lived) in Authorization header
- Refresh tokens (long-lived) stored in DB for revocation
- Frontend auto-refreshes on 401 via axios interceptor

**Middleware Chain:**
1. `autenticar` - Verifies JWT, loads user + perfil + permissoes
2. `autorizarPermissao(permission)` - Checks if user's perfil has required permission
3. `autenticarOpcional` - Optional auth (doesn't block if token missing)

**Permissions:** `dashboard`, `fornecedores`, `contratos`, `relatorio`, `usuarios`, `perfis`, `auditoria`
- Admins (perfil.isAdmin = true) bypass all permission checks

**Rate Limiting:**
- Login attempts limited (prevent brute force)
- Registration limited (prevent spam)
- Password reset limited

## External API Integration

**ERP System:** Datasul API at `http://192.168.69.213:8080/api/cnp/v1/medicoes`

**Sync Flow:**
1. Backend queries ERP with contract/establishment/sequence parameters
2. Receives measurement data (invoices, dates, values, registration status)
3. Stores locally in MongoDB to avoid API overload
4. Subsequent queries use local cache unless explicitly resynced
5. Detects value mismatches and sets `alertaValor` flag

**Key Field Mappings:**
- `sld-val-medicao` = 0 → invoice registered in ERP
- `sld-val-medicao` > 0 → invoice pending registration
- `dat-medicao` - TI measurement date
- `dat-prev-medicao` - Invoice issue date by supplier
- `dat-receb` - Receipt date by fiscal sector
- `numero-nota` - Invoice number (present when registered)

## Business Logic Patterns

### Status Calculation (Sequencia.statusMensal)

Status is calculated per month based on:
- Current date vs. `diaEmissao`
- Presence of measurements from ERP
- Invoice registration status in ERP
- Value discrepancies

**Status Values:**
- `futuro` - Emission day not yet reached this month
- `pendente` - No measurement yet, within deadline
- `atrasada` - Past emission day, no measurement
- `ok` - Measurement recorded
- `registrada` - Invoice registered in ERP
- `nao_registrada` - Measurement exists but invoice not yet registered
- `atualizar_contrato` - Value mismatch detected between expected and actual

### Email Notifications

Controlled by `SMTP_ENABLE` environment variable.
- If disabled: logs warning, doesn't send email, doesn't error
- Supports: OTP codes, verification links, password reset, login alerts
- All email operations are audit-logged

### Audit Trail

Every CRUD operation automatically logged via `auditService.logCrud()`.
- Captures: user, action, resource type, before/after snapshots, changed fields, IP, timestamp
- Sensitive fields (passwords, tokens, OTP) are redacted
- Provides: audit log viewer, statistics, CSV/JSON export, resource history

## Common Development Tasks

### Adding New API Endpoints

1. Define route in `server/routes/index.js` or create new route file
2. Create controller function in `server/controllers/`
3. Add authentication: `router.get('/path', autenticar, autorizarPermissao('permission'), controller.method)`
4. Add audit logging in controller using `auditService.logCrud()`
5. Create frontend API method in `frontend/src/services/api.js`

### Modifying Database Schema

1. Update model in `server/models/`
2. Create migration script in `server/scripts/` if needed
3. Update seed data in `server/config/seed.js` if applicable
4. Test with fresh database: delete DB, restart server (auto-seeds)

### Adding New Permissions

1. Update `Perfil` model permissoes enum in `server/models/Perfil.js`
2. Update seed data in `server/config/seed.js` to include new permission
3. Add `autorizarPermissao('new-permission')` to relevant routes
4. Update frontend: add to role management UI, add `ProtectedPermission` wrappers

### Working with ERP Integration

The ERP API integration is in `server/services/medicaoService.js`:
- `sincronizarMedicoes(sequenciaId)` - Sync single sequence
- `buscarMedicoes(query)` - Search local cache
- `calcularStatusSequencia(sequencia, medicoes)` - Compute monthly status

**Important:** Always check local DB first before querying ERP. The system caches measurements to avoid overloading external API.

## Environment Variables

Required `.env` files in `/server`:

```
# Database
MONGODB_URI=mongodb://localhost:27017/contratos

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Email (optional)
SMTP_ENABLE=false
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM=noreply@example.com

# Server
PORT=3000
NODE_ENV=development

# Proxy (for IP detection behind load balancers)
TRUST_PROXY=loopback
```

## Code Style Notes

- Backend uses CommonJS (`require`/`module.exports`)
- Frontend uses ES modules (`import`/`export`)
- MongoDB ObjectIds are converted to `id` string via `toJSON` virtuals
- All dates stored as Date objects, formatted on frontend
- Error responses follow format: `{ message: 'Error description' }`
- Success responses vary by endpoint (often `{ data: {...} }`)

## Testing Approach

Currently no automated tests. Manual testing workflow:
1. Use `npm run create-admin` to create admin user
2. Login via frontend to get JWT
3. Test API endpoints with authenticated requests
4. Check audit logs in `/configuracoes` → Auditoria
5. Monitor console for errors

## Deployment Notes

- Build frontend: `cd frontend && npm run build`
- Frontend builds to `frontend/dist/`
- Backend serves static files from `dist/` automatically
- Single server process on port 3000 (configurable via PORT env var)
- MongoDB must be running and accessible via MONGODB_URI
- Use process manager (PM2, systemd) for production deployment
