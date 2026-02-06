# Plano de Migração: MongoDB/Mongoose → MySQL/Sequelize

## Resumo

Migração completa do banco de dados do PROMA SIGMA de MongoDB (Mongoose) para MySQL (Sequelize). O projeto possui **11 modelos Mongoose**, **4 serviços**, **12 controllers**, **2 middlewares** e **4 scripts** que precisam ser alterados — totalizando ~35-40 arquivos.

---

## Decisões de Design

| Decisão | Escolha |
|---------|---------|
| ORM | **Sequelize v6** (maduro, suporte MySQL excelente) |
| Driver | **mysql2** |
| Campos hifenizados (`nr-contrato`) | Converter para **snake_case** (`nr_contrato`) |
| `statusMensal` (Map) | Coluna **JSON** |
| `dadosAnteriores/dadosNovos/metadados` (Mixed) | Colunas **JSON** |
| `permissoes` (Array) | **Tabela de junção** `perfil_permissoes` |
| `eventos` (Array) | **Tabela de junção** `webhook_eventos` |
| Primary Keys | **INT UNSIGNED AUTO_INCREMENT** (substitui ObjectId) |
| TTL Indexes | **MySQL Scheduled Events** |
| Virtuals (reverse populate) | **Associations Sequelize** (`hasMany`/`belongsTo`) |

---

## Fase 1: Infraestrutura e Schema MySQL

### 1.1 Instalar dependências

```bash
cd server
npm install sequelize mysql2
npm uninstall mongoose  # apenas ao final da migração
```

### 1.2 Configurar variáveis de ambiente

Substituir no `server/.env`:
```env
# Remover:
# MONGODB_URI=mongodb://localhost:27017/PROMA_SIGMA_DEV

# Adicionar:
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=proma_sigma
MYSQL_USER=root
MYSQL_PASSWORD=sua-senha
```

### 1.3 Criar Schema MySQL (13 tabelas + 2 tabelas de junção)

```sql
SET GLOBAL event_scheduler = ON;

-- 1. perfis
CREATE TABLE perfis (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao VARCHAR(200) DEFAULT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_perfis_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. perfil_permissoes (junção para Perfil.permissoes[])
CREATE TABLE perfil_permissoes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    perfil_id INT UNSIGNED NOT NULL,
    permissao ENUM('dashboard','fornecedores','contratos','relatorio',
                   'usuarios','perfis','auditoria','empresas','estabelecimentos') NOT NULL,
    FOREIGN KEY (perfil_id) REFERENCES perfis(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_perfil_permissao (perfil_id, permissao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. users
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(30) NOT NULL,
    nome VARCHAR(100) DEFAULT NULL,
    foto_perfil MEDIUMTEXT DEFAULT NULL,
    email VARCHAR(255) NOT NULL,
    senha VARCHAR(255) DEFAULT NULL,
    conta_ativada BOOLEAN NOT NULL DEFAULT FALSE,
    token_ativacao_conta VARCHAR(255) DEFAULT NULL,
    token_ativacao_expira DATETIME DEFAULT NULL,
    perfil_id INT UNSIGNED DEFAULT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    token_verificacao_email VARCHAR(255) DEFAULT NULL,
    token_verificacao_expira DATETIME DEFAULT NULL,
    token_reset_senha VARCHAR(255) DEFAULT NULL,
    token_reset_expira DATETIME DEFAULT NULL,
    otp_code VARCHAR(255) DEFAULT NULL,
    otp_expira DATETIME DEFAULT NULL,
    ultimo_login DATETIME DEFAULT NULL,
    tentativas_login INT NOT NULL DEFAULT 0,
    bloqueado_ate DATETIME DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_users_usuario (usuario),
    UNIQUE INDEX idx_users_email (email),
    FOREIGN KEY (perfil_id) REFERENCES perfis(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. fornecedores
CREATE TABLE fornecedores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. empresas
CREATE TABLE empresas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cod_empresa VARCHAR(10) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_empresas_cod (cod_empresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. estabelecimentos
CREATE TABLE estabelecimentos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT UNSIGNED NOT NULL,
    cod_estabel VARCHAR(10) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_estab_empresa_cod (empresa_id, cod_estabel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. contratos
CREATE TABLE contratos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fornecedor_id INT UNSIGNED NOT NULL,
    nr_contrato INT NOT NULL,
    estabelecimento_id INT UNSIGNED NOT NULL,
    cod_estabel VARCHAR(10) NOT NULL DEFAULT '01',
    observacao TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE CASCADE,
    FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE,
    INDEX idx_contratos_compound (fornecedor_id, nr_contrato, estabelecimento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. sequencias
CREATE TABLE sequencias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    contrato_id INT UNSIGNED NOT NULL,
    num_seq_item INT NOT NULL,
    dia_emissao INT NOT NULL CHECK (dia_emissao BETWEEN 1 AND 31),
    valor DECIMAL(12,2) NOT NULL CHECK (valor >= 0),
    status_mensal JSON DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE,
    INDEX idx_sequencias_contrato (contrato_id, num_seq_item)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. medicoes
CREATE TABLE medicoes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sequencia_id INT UNSIGNED NOT NULL,
    num_seq_medicao INT NOT NULL,
    cod_estabel VARCHAR(10) NOT NULL,
    serie_nota VARCHAR(50) DEFAULT '',
    sld_val_medicao DECIMAL(12,2) DEFAULT 0,
    num_seq_item INT NOT NULL,
    numero_ordem INT DEFAULT 0,
    val_medicao DECIMAL(12,2) NOT NULL,
    dat_medicao DATETIME NOT NULL,
    sld_rec_medicao DECIMAL(12,2) DEFAULT 0,
    nr_contrato INT NOT NULL,
    dat_prev_medicao DATETIME DEFAULT NULL,
    numero_nota VARCHAR(50) DEFAULT '',
    nome_emit VARCHAR(255) DEFAULT '',
    dat_receb DATETIME DEFAULT NULL,
    responsavel VARCHAR(255) DEFAULT '',
    mes_referencia VARCHAR(7) NOT NULL,
    status_registro ENUM('registrada','nao_registrada','pendente') NOT NULL DEFAULT 'pendente',
    alerta_valor BOOLEAN NOT NULL DEFAULT FALSE,
    diferenca_valor DECIMAL(12,2) DEFAULT 0,
    sincronizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sequencia_id) REFERENCES sequencias(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_medicoes_compound (nr_contrato, cod_estabel, num_seq_item, num_seq_medicao),
    INDEX idx_medicoes_seq_mes (sequencia_id, mes_referencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. refresh_tokens
CREATE TABLE refresh_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    expires_at DATETIME NOT NULL,
    created_by_ip VARCHAR(45) DEFAULT NULL,
    revoked DATETIME DEFAULT NULL,
    revoked_by_ip VARCHAR(45) DEFAULT NULL,
    replaced_by_token VARCHAR(255) DEFAULT NULL,
    user_agent VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_refresh_token (token),
    INDEX idx_refresh_user (user_id),
    INDEX idx_refresh_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. audit_logs (BIGINT para alto volume)
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED DEFAULT NULL,
    usuario_nome VARCHAR(100) DEFAULT 'Sistema',
    usuario_email VARCHAR(255) DEFAULT NULL,
    acao ENUM('LOGIN_SUCESSO','LOGIN_FALHA','LOGIN_BLOQUEADO','LOGOUT','LOGOUT_TODOS',
             'REGISTRO','CONTA_ATIVADA','SENHA_ALTERADA','SENHA_RESET',
             'SENHA_RESET_SOLICITADO','EMAIL_VERIFICADO','OTP_SOLICITADO',
             'OTP_VERIFICADO','TOKEN_REFRESH','CRIAR','ATUALIZAR','EXCLUIR',
             'VISUALIZAR','ATIVAR','DESATIVAR','ALTERAR_PERMISSOES','ALTERAR_PERFIL',
             'SINCRONIZAR','SINCRONIZAR_LOTE','EXPORTAR','IMPORTAR',
             'EMAIL_ENVIADO','EMAIL_FALHA') NOT NULL,
    categoria ENUM('AUTH','USUARIO','PERFIL','FORNECEDOR','CONTRATO','SEQUENCIA',
                   'MEDICAO','SISTEMA','EMAIL','EMPRESA','ESTABELECIMENTO') NOT NULL,
    nivel ENUM('INFO','WARN','ERROR','CRITICAL') NOT NULL DEFAULT 'INFO',
    recurso VARCHAR(100) NOT NULL,
    recurso_id INT UNSIGNED DEFAULT NULL,
    recurso_nome VARCHAR(255) DEFAULT NULL,
    descricao TEXT NOT NULL,
    dados_anteriores JSON DEFAULT NULL,
    dados_novos JSON DEFAULT NULL,
    campos_alterados JSON DEFAULT NULL,
    endereco_ip VARCHAR(45) DEFAULT NULL,
    user_agent VARCHAR(500) DEFAULT NULL,
    sucesso BOOLEAN NOT NULL DEFAULT TRUE,
    mensagem_erro TEXT DEFAULT NULL,
    metadados JSON DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_audit_created (created_at DESC),
    INDEX idx_audit_usuario (usuario_id, created_at DESC),
    INDEX idx_audit_categoria (categoria, created_at DESC),
    INDEX idx_audit_acao (acao, created_at DESC),
    INDEX idx_audit_recurso (recurso, recurso_id),
    INDEX idx_audit_nivel (nivel, created_at DESC),
    INDEX idx_audit_sucesso (sucesso, created_at DESC),
    INDEX idx_audit_cat_acao (categoria, acao, created_at DESC),
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. webhooks
CREATE TABLE webhooks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_disparo DATETIME DEFAULT NULL,
    falhas_consecutivas INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. webhook_eventos (junção para Webhook.eventos[])
CREATE TABLE webhook_eventos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    webhook_id INT UNSIGNED NOT NULL,
    evento ENUM('nf_atrasada','nf_pendente','nf_status_alterado',
                'contrato_vencendo','resumo_diario') NOT NULL,
    FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_webhook_evento (webhook_id, evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scheduled Events (substitui TTL indexes do MongoDB)
CREATE EVENT IF NOT EXISTS cleanup_expired_refresh_tokens
ON SCHEDULE EVERY 1 HOUR
DO DELETE FROM refresh_tokens WHERE expires_at < NOW();

CREATE EVENT IF NOT EXISTS cleanup_old_audit_logs
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP + INTERVAL 1 HOUR
DO DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 365 DAY);
```

---

## Fase 2: Reescrever Modelos Sequelize

### Arquivos a modificar (reescrita completa)

| Arquivo | Complexidade | Notas |
|---------|-------------|-------|
| `server/config/db.js` | Alta | Substituir `mongoose.connect()` por `new Sequelize(...)` |
| `server/models/User.js` | Alta | Hook `beforeSave` (bcrypt), `defaultScope` para excluir campos sensiveis, scopes nomeados, metodos de instancia |
| `server/models/Perfil.js` | Alta | Remover array `permissoes`, associar com `PerfilPermissao` |
| `server/models/Contrato.js` | Media | Renomear `nr-contrato` -> `nr_contrato`, `cod-estabel` -> `cod_estabel` |
| `server/models/Sequencia.js` | Media | Map `statusMensal` -> JSON `status_mensal` |
| `server/models/Medicao.js` | Alta | Renomear 14 campos hifenizados para snake_case |
| `server/models/RefreshToken.js` | Media | Virtuals `isExpired`/`isActive` via `DataTypes.VIRTUAL` |
| `server/models/AuditLog.js` | Media | Mixed -> JSON, BIGINT PK |
| `server/models/Fornecedor.js` | Baixa | `hasMany(Contrato)` |
| `server/models/Empresa.js` | Baixa | `hasMany(Estabelecimento)` |
| `server/models/Estabelecimento.js` | Baixa | `belongsTo(Empresa)` |
| `server/models/Webhook.js` | Media | Remover array `eventos`, associar com `WebhookEvento` |

### Arquivos novos a criar

| Arquivo | Funcao |
|---------|--------|
| `server/models/PerfilPermissao.js` | Tabela de juncao `perfil_permissoes` |
| `server/models/WebhookEvento.js` | Tabela de juncao `webhook_eventos` |
| `server/models/index.js` | Hub central: importa Sequelize, define modelos e associacoes |

### Mapeamento de Associacoes Sequelize

```
Perfil.hasMany(PerfilPermissao)       | PerfilPermissao.belongsTo(Perfil)
Perfil.hasMany(User)                  | User.belongsTo(Perfil)
User.hasMany(RefreshToken)            | RefreshToken.belongsTo(User)
User.hasMany(AuditLog)                | AuditLog.belongsTo(User)
Empresa.hasMany(Estabelecimento)      | Estabelecimento.belongsTo(Empresa)
Fornecedor.hasMany(Contrato)          | Contrato.belongsTo(Fornecedor)
Estabelecimento.hasMany(Contrato)     | Contrato.belongsTo(Estabelecimento)
Contrato.hasMany(Sequencia)           | Sequencia.belongsTo(Contrato)
Sequencia.hasMany(Medicao)            | Medicao.belongsTo(Sequencia)
Webhook.hasMany(WebhookEvento)        | WebhookEvento.belongsTo(Webhook)
```

---

## Fase 3: Reescrever Servicos e Middleware

### Tabela de conversao Mongoose -> Sequelize

| Mongoose | Sequelize |
|----------|-----------|
| `Model.find(query)` | `Model.findAll({ where: query })` |
| `Model.findById(id)` | `Model.findByPk(id)` |
| `Model.findOne(query)` | `Model.findOne({ where: query })` |
| `Model.findByIdAndUpdate(id, data)` | `Model.update(data, { where: { id } })` + `findByPk(id)` |
| `Model.findByIdAndDelete(id)` | `Model.destroy({ where: { id } })` |
| `Model.deleteMany(query)` | `Model.destroy({ where: query })` |
| `Model.countDocuments(query)` | `Model.count({ where: query })` |
| `Model.insertMany(arr)` | `Model.bulkCreate(arr)` |
| `new Model(data).save()` | `Model.create(data)` |
| `.populate('field', 'f1 f2')` | `include: [{ model: M, attributes: ['f1','f2'] }]` |
| `.sort({ field: 1 })` | `order: [['field', 'ASC']]` |
| `.skip(n).limit(m)` | `offset: n, limit: m` |
| `.lean()` | `raw: true` |
| `.select('-f1 -f2')` | `attributes: { exclude: ['f1','f2'] }` |
| `.select('+senha')` | `Model.scope('withSenha').findOne(...)` |
| `{ $or: [...] }` | `{ [Op.or]: [...] }` |
| `{ $regex: s, $options: 'i' }` | `{ [Op.like]: '%'+s+'%' }` |
| `{ $ne: v }` | `{ [Op.ne]: v }` |
| `{ $in: arr }` | `{ [Op.in]: arr }` |
| `{ $gte: d, $lte: d2 }` | `{ [Op.gte]: d, [Op.lte]: d2 }` |
| `findOneAndUpdate({}, {}, {upsert:true})` | `Model.upsert(data)` |
| `updateMany(filter, update)` | `Model.update(update, { where: filter })` |
| `statusMensal.get(key)` | `status_mensal?.[key]` |
| `statusMensal.set(key, val)` | Atualizar objeto JSON e salvar |
| `aggregate([{$match},{$group}])` | `findAll({ where, attributes: [fn,col], group })` |

### Arquivos a modificar

| Arquivo | Complexidade | Alteracoes principais |
|---------|-------------|----------------------|
| `server/services/auditService.js` | **Alta** (407 linhas) | 5 aggregation pipelines -> `GROUP BY` + `sequelize.fn()`. `$regex` -> `Op.like`. `$dateToString` -> `DATE_FORMAT()` |
| `server/services/medicaoService.js` | **Alta** (325 linhas) | 14 campos hifenizados -> snake_case. `findOneAndUpdate(upsert)` -> `upsert()`. Map `.get()`/`.set()` -> JSON |
| `server/services/authService.js` | Media (211 linhas) | `updateMany` -> `Model.update()`. `.populate()` -> `include` |
| `server/services/webhookService.js` | Media (192 linhas) | Query em array `eventos` -> JOIN com `webhook_eventos` |
| `server/middleware/auth.js` | Media | `Perfil.findById()` -> `findByPk({ include: PerfilPermissao })`. Extrair permissoes da junction table |

### Exemplo: Conversao de Aggregation Pipeline

**Antes (MongoDB):**
```javascript
AuditLog.aggregate([
    { $match: { createdAt: { $gte: dataInicio } } },
    { $group: { _id: '$categoria', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
])
```

**Depois (Sequelize):**
```javascript
AuditLog.findAll({
    where: { created_at: { [Op.gte]: dataInicio } },
    attributes: ['categoria', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['categoria'],
    order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
    raw: true
})
```

---

## Fase 4: Reescrever Controllers

| Arquivo | Complexidade | Notas |
|---------|-------------|-------|
| `server/controllers/authController.js` | **Alta** (775 linhas) | `$or`, `.select('+senha')` -> scopes, `.populate()` -> `include`, `user._id` -> `user.id` |
| `server/controllers/perfilController.js` | **Alta** (192 linhas) | CRUD de permissoes via tabela de juncao (delete + bulkCreate) |
| `server/controllers/contratoController.js` | Media (221 linhas) | `nr-contrato` -> `nr_contrato`. Nested populate -> nested include |
| `server/controllers/sequenciaController.js` | Media (240 linhas) | Map.set() -> JSON update. Campos hifenizados |
| `server/controllers/medicaoController.js` | Media (234 linhas) | Campos hifenizados. Nested populate |
| `server/controllers/userController.js` | Media (349 linhas) | `$or`/`$regex`/`$ne` -> Sequelize Ops |
| `server/controllers/relatorioController.js` | Media (222 linhas) | Populate chains -> include chains. Map -> JSON |
| `server/controllers/webhookController.js` | Media (154 linhas) | Junction table para eventos |
| `server/controllers/fornecedorController.js` | Baixa (118 linhas) | Cascade delete: `$in` -> `Op.in` |
| `server/controllers/empresaController.js` | Baixa (118 linhas) | Simples CRUD |
| `server/controllers/estabelecimentoController.js` | Baixa (146 linhas) | `belongsTo` Empresa |
| `server/controllers/auditController.js` | Baixa (220 linhas) | Delega ao auditService |

---

## Fase 5: Config, Scripts e Entry Point

| Arquivo | Alteracao |
|---------|-----------|
| `server/server.js` | `connectDB()` -> `sequelize.authenticate()` + `sequelize.sync()` |
| `server/config/seed.js` | `insertMany()` -> `bulkCreate()`. Criar registros na tabela de juncao para permissoes |
| `server/config/seedAdmin.js` | Conexao Sequelize. `findOne` -> Sequelize syntax |
| `server/scripts/createFirstAdmin.js` | Conexao + queries Sequelize |
| `server/scripts/migratePerfil.js` | Reescrever para Sequelize |

---

## Fase 6: Script de Migracao de Dados

### Ordem de migracao (respeita FKs)

1. `perfis`
2. `perfil_permissoes`
3. `users`
4. `fornecedores`
5. `empresas`
6. `estabelecimentos`
7. `contratos`
8. `sequencias`
9. `medicoes`
10. `refresh_tokens`
11. `audit_logs`
12. `webhooks`
13. `webhook_eventos`

### Criar `server/scripts/migrateToMySQL.js`

- Conecta simultaneamente ao MongoDB (Mongoose) e MySQL (Sequelize)
- Mantem Map de IDs em memoria: `{ collectionName: { oldObjectId: newIntId } }`
- Para cada documento:
  - Renomear campos hifenizados -> snake_case
  - Converter `ObjectId` refs -> IDs inteiros mapeados
  - Converter `Map` (statusMensal) -> `JSON.stringify(Object.fromEntries(...))`
  - Converter `Array` (permissoes/eventos) -> registros na tabela de juncao
  - Converter `Mixed` -> JSON
  - Tratar `undefined` como `NULL`

### Verificacao pos-migracao

- Contar registros: MySQL vs MongoDB por tabela
- Verificar integridade de FKs
- Spot-check 10 registros aleatorios por tabela
- Rodar aplicacao e testar fluxos principais

---

## Fase 7: Impacto no Frontend

### Mapeamento de campos na API

Os campos hifenizados mudam de nome nas respostas JSON da API. Duas opcoes:

**Opcao A (Recomendada):** Criar camada de compatibilidade no backend que mapeia `nr_contrato` -> `nr-contrato` nas respostas, evitando alteracoes no frontend.

**Opcao B:** Atualizar todos os arquivos do frontend que referenciam campos hifenizados:
- `frontend/src/pages/Contratos.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/RelatorioMensal.jsx`
- `frontend/src/pages/Fornecedores.jsx`
- `frontend/src/pages/Configuracoes.jsx`
- `frontend/src/services/api.js`

---

## Fase 8: Testes

### Checklist de teste manual

1. Login/logout completo
2. Criar usuario admin, fluxo de ativacao
3. Cadeia: Empresa -> Estabelecimento -> Fornecedor -> Contrato -> Sequencia
4. Sincronizar medicoes do ERP
5. Relatorio mensal e dashboard
6. Auditoria em Configuracoes
7. Cascade delete (excluir fornecedor -> contratos + sequencias removidos)
8. Sistema de permissoes (criar perfil, atribuir, verificar acesso)
9. Webhooks (criar e disparar)
10. Exportar audit logs CSV

---

## Plano de Rollback

1. **Antes de iniciar:** `mongodump --db PROMA_SIGMA_DEV --out backup/`
2. **Branch Git:** Trabalhar em `feature/mysql-migration`, `main` permanece com MongoDB
3. **MongoDB intocado:** Nenhuma alteracao destrutiva no MongoDB durante a migracao
4. **Para reverter:** Voltar ao branch `main` -> restaurar `.env` com `MONGODB_URI` -> reiniciar

---

## Mapeamento Completo de Campos (Referencia)

| MongoDB (camelCase/hifenizado) | MySQL (snake_case) |
|---|---|
| `nr-contrato` | `nr_contrato` |
| `cod-estabel` | `cod_estabel` |
| `num-seq-item` | `num_seq_item` |
| `num-seq-medicao` | `num_seq_medicao` |
| `serie-nota` | `serie_nota` |
| `sld-val-medicao` | `sld_val_medicao` |
| `numero-ordem` | `numero_ordem` |
| `val-medicao` | `val_medicao` |
| `dat-medicao` | `dat_medicao` |
| `sld-rec-medicao` | `sld_rec_medicao` |
| `dat-prev-medicao` | `dat_prev_medicao` |
| `numero-nota` | `numero_nota` |
| `nome-emit` | `nome_emit` |
| `dat-receb` | `dat_receb` |
| `diaEmissao` | `dia_emissao` |
| `statusMensal` | `status_mensal` (JSON) |
| `mesReferencia` | `mes_referencia` |
| `statusRegistro` | `status_registro` |
| `alertaValor` | `alerta_valor` |
| `diferencaValor` | `diferenca_valor` |
| `sincronizadoEm` | `sincronizado_em` |
| `codEmpresa` | `cod_empresa` |
| `isAdmin` | `is_admin` |
| `contaAtivada` | `conta_ativada` |
| `emailVerificado` | `email_verificado` |
| `ultimoLogin` | `ultimo_login` |
| `tentativasLogin` | `tentativas_login` |
| `bloqueadoAte` | `bloqueado_ate` |
| `fotoPerfil` | `foto_perfil` |
| `ultimoDisparo` | `ultimo_disparo` |
| `falhasConsecutivas` | `falhas_consecutivas` |
| `_id` | `id` (INT AUTO_INCREMENT) |

---

## Diagrama de Relacionamentos

```
Empresa (1) ──→ (N) Estabelecimento
Fornecedor (1) ──→ (N) Contrato
Estabelecimento (1) ──→ (N) Contrato
Contrato (1) ──→ (N) Sequencia
Sequencia (1) ──→ (N) Medicao

Perfil (1) ──→ (N) PerfilPermissao
Perfil (1) ──→ (N) User
User (1) ──→ (N) RefreshToken
User (1) ──→ (N) AuditLog

Webhook (1) ──→ (N) WebhookEvento
```
