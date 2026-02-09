const auditService = require('../services/auditService');

// Listar logs de auditoria com filtros
exports.getLogs = async (req, res) => {
    try {
        const {
            pagina = 1,
            limite = 50,
            usuarioId,
            categoria,
            acao,
            recurso,
            recursoId,
            nivel,
            sucesso,
            dataInicio,
            dataFim,
            busca,
            ordenarPor = 'created_at',
            ordem = 'desc'
        } = req.query;

        const filtros = {};
        if (usuarioId) filtros.usuarioId = usuarioId;
        if (categoria) filtros.categoria = categoria;
        if (acao) filtros.acao = acao;
        if (recurso) filtros.recurso = recurso;
        if (recursoId) filtros.recursoId = recursoId;
        if (nivel) filtros.nivel = nivel;
        if (sucesso !== undefined) filtros.sucesso = sucesso === 'true';
        if (dataInicio) filtros.dataInicio = dataInicio;
        if (dataFim) filtros.dataFim = dataFim;
        if (busca) filtros.busca = busca;

        const resultado = await auditService.buscar(filtros, {
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            ordenarPor,
            ordem
        });

        res.json(resultado);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar historico de um recurso especifico
exports.getHistorico = async (req, res) => {
    try {
        const { recurso, recursoId } = req.params;
        const { limite = 50 } = req.query;

        const logs = await auditService.buscarHistorico(recurso, recursoId, parseInt(limite));

        res.json({
            recurso,
            recursoId,
            total: logs.length,
            logs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar logs de um usuario especifico
exports.getLogsByUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { limite = 100 } = req.query;

        const logs = await auditService.buscarPorUsuario(usuarioId, parseInt(limite));

        res.json({
            usuarioId,
            total: logs.length,
            logs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Estatisticas de auditoria
exports.getEstatisticas = async (req, res) => {
    try {
        const { periodo = 30 } = req.query;

        const estatisticas = await auditService.estatisticas(parseInt(periodo));

        res.json(estatisticas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Listar categorias disponiveis
exports.getCategorias = async (req, res) => {
    try {
        const categorias = [
            { id: 'AUTH', nome: 'Autenticacao', descricao: 'Eventos de login, logout e autenticacao' },
            { id: 'USUARIO', nome: 'Usuarios', descricao: 'Gestao de usuarios' },
            { id: 'PERFIL', nome: 'Perfis', descricao: 'Gestao de perfis e permissoes' },
            { id: 'FORNECEDOR', nome: 'Fornecedores', descricao: 'Gestao de fornecedores' },
            { id: 'CONTRATO', nome: 'Contratos', descricao: 'Gestao de contratos' },
            { id: 'SEQUENCIA', nome: 'Sequencias', descricao: 'Gestao de sequencias' },
            { id: 'MEDICAO', nome: 'Medicoes', descricao: 'Sincronizacao e medicoes' },
            { id: 'SISTEMA', nome: 'Sistema', descricao: 'Eventos de sistema' }
        ];

        res.json(categorias);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Listar acoes disponiveis
exports.getAcoes = async (req, res) => {
    try {
        const acoes = [
            // Autenticacao
            { id: 'LOGIN_SUCESSO', categoria: 'AUTH', descricao: 'Login bem-sucedido' },
            { id: 'LOGIN_FALHA', categoria: 'AUTH', descricao: 'Tentativa de login falha' },
            { id: 'LOGIN_BLOQUEADO', categoria: 'AUTH', descricao: 'Login bloqueado por tentativas' },
            { id: 'LOGOUT', categoria: 'AUTH', descricao: 'Logout realizado' },
            { id: 'LOGOUT_TODOS', categoria: 'AUTH', descricao: 'Logout de todos dispositivos' },
            { id: 'REGISTRO', categoria: 'AUTH', descricao: 'Novo registro de usuario' },
            { id: 'SENHA_ALTERADA', categoria: 'AUTH', descricao: 'Senha alterada pelo usuario' },
            { id: 'SENHA_RESET', categoria: 'AUTH', descricao: 'Senha redefinida' },
            { id: 'EMAIL_VERIFICADO', categoria: 'AUTH', descricao: 'Email verificado' },
            { id: 'OTP_SOLICITADO', categoria: 'AUTH', descricao: 'OTP solicitado' },
            // CRUD
            { id: 'CRIAR', categoria: 'CRUD', descricao: 'Recurso criado' },
            { id: 'ATUALIZAR', categoria: 'CRUD', descricao: 'Recurso atualizado' },
            { id: 'EXCLUIR', categoria: 'CRUD', descricao: 'Recurso excluido' },
            // Especificas
            { id: 'ATIVAR', categoria: 'ESPECIFICA', descricao: 'Recurso ativado' },
            { id: 'DESATIVAR', categoria: 'ESPECIFICA', descricao: 'Recurso desativado' },
            { id: 'ALTERAR_PERMISSOES', categoria: 'ESPECIFICA', descricao: 'Permissoes alteradas' },
            { id: 'SINCRONIZAR', categoria: 'ESPECIFICA', descricao: 'Sincronizacao individual' },
            { id: 'SINCRONIZAR_LOTE', categoria: 'ESPECIFICA', descricao: 'Sincronizacao em lote' }
        ];

        res.json(acoes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Exportar logs (para download)
exports.exportar = async (req, res) => {
    try {
        const {
            formato = 'json',
            usuarioId,
            categoria,
            acao,
            dataInicio,
            dataFim,
            limite = 1000
        } = req.query;

        const filtros = {};
        if (usuarioId) filtros.usuarioId = usuarioId;
        if (categoria) filtros.categoria = categoria;
        if (acao) filtros.acao = acao;
        if (dataInicio) filtros.dataInicio = dataInicio;
        if (dataFim) filtros.dataFim = dataFim;

        const resultado = await auditService.buscar(filtros, {
            pagina: 1,
            limite: parseInt(limite),
            ordenarPor: 'created_at',
            ordem: 'desc'
        });

        // Log da exportacao
        await auditService.logCrud(req, 'EXPORTAR', 'SISTEMA', 'AuditLog', {
            descricao: `Exportacao de logs de auditoria: ${resultado.logs.length} registros`,
            metadados: { formato, filtros, registros: resultado.logs.length }
        });

        if (formato === 'csv') {
            // Gerar CSV
            const headers = [
                'Data/Hora',
                'Usuario',
                'Acao',
                'Categoria',
                'Recurso',
                'Descricao',
                'Sucesso',
                'IP'
            ];

            const rows = resultado.logs.map(log => [
                new Date(log.created_at).toISOString(),
                log.usuarioNome || 'Sistema',
                log.acao,
                log.categoria,
                log.recurso,
                log.descricao,
                log.sucesso ? 'Sim' : 'Nao',
                log.enderecoIp || '-'
            ]);

            const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.csv`);
            res.send('\uFEFF' + csv); // BOM para Excel
        } else {
            res.json(resultado.logs);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
