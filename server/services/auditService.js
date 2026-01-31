const { AuditLog } = require('../models');

/**
 * Servico de Auditoria
 * Responsavel por registrar todas as acoes do sistema para fins de auditoria
 */
const auditService = {
    /**
     * Registra um log de auditoria
     * @param {Object} dados - Dados do log
     * @returns {Promise<AuditLog>}
     */
    async registrar(dados) {
        try {
            const log = new AuditLog({
                usuarioId: dados.usuarioId || null,
                usuarioNome: dados.usuarioNome || 'Sistema',
                usuarioEmail: dados.usuarioEmail || null,
                acao: dados.acao,
                categoria: dados.categoria,
                nivel: dados.nivel || 'INFO',
                recurso: dados.recurso,
                recursoId: dados.recursoId || null,
                recursoNome: dados.recursoNome || null,
                descricao: dados.descricao,
                dadosAnteriores: dados.dadosAnteriores || null,
                dadosNovos: dados.dadosNovos || null,
                camposAlterados: dados.camposAlterados || [],
                enderecoIp: dados.enderecoIp || null,
                userAgent: dados.userAgent || null,
                sucesso: dados.sucesso !== undefined ? dados.sucesso : true,
                mensagemErro: dados.mensagemErro || null,
                metadados: dados.metadados || {}
            });

            await log.save();
            return log;
        } catch (error) {
            console.error('Erro ao registrar log de auditoria:', error);
            // Nao lanca erro para nao interromper a operacao principal
            return null;
        }
    },

    /**
     * Extrai informacoes do request para contexto
     * @param {Object} req - Request do Express
     * @returns {Object}
     */
    extrairContexto(req) {
        return {
            enderecoIp: this.extrairIpReal(req),
            userAgent: req.get('User-Agent') || null,
            usuarioId: req.user?.id || null,
            usuarioNome: req.user?.usuario || req.user?.nome || 'Sistema',
            usuarioEmail: req.user?.email || null
        };
    },

    /**
     * Extrai o IP real do cliente, considerando proxies e load balancers
     * @param {Object} req - Request do Express
     * @returns {string|null}
     */
    extrairIpReal(req) {
        // Headers comuns de proxy (em ordem de prioridade)
        const xForwardedFor = req.headers['x-forwarded-for'];
        const xRealIp = req.headers['x-real-ip'];
        const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare

        let ip = null;

        // X-Forwarded-For pode conter multiplos IPs: "client, proxy1, proxy2"
        if (xForwardedFor) {
            ip = xForwardedFor.split(',')[0].trim();
        } else if (xRealIp) {
            ip = xRealIp;
        } else if (cfConnectingIp) {
            ip = cfConnectingIp;
        } else {
            ip = req.ip || req.connection?.remoteAddress || null;
        }

        // Remove prefixo IPv6 mapeado de IPv4 (::ffff:192.168.1.1 -> 192.168.1.1)
        if (ip && ip.startsWith('::ffff:')) {
            ip = ip.substring(7);
        }

        return ip;
    },

    /**
     * Compara dois objetos e retorna os campos alterados
     * @param {Object} antes - Objeto antes da alteracao
     * @param {Object} depois - Objeto apos a alteracao
     * @returns {Array<string>}
     */
    detectarAlteracoes(antes, depois) {
        const camposAlterados = [];
        const todasChaves = new Set([...Object.keys(antes || {}), ...Object.keys(depois || {})]);

        for (const chave of todasChaves) {
            // Ignora campos sensiveis e internos
            if (['senha', '_id', '__v', 'createdAt', 'updatedAt', 'tokenVerificacaoEmail',
                 'tokenVerificacaoExpira', 'tokenResetSenha', 'tokenResetExpira',
                 'otpCode', 'otpExpira'].includes(chave)) {
                continue;
            }

            const valorAntes = JSON.stringify(antes?.[chave]);
            const valorDepois = JSON.stringify(depois?.[chave]);

            if (valorAntes !== valorDepois) {
                camposAlterados.push(chave);
            }
        }

        return camposAlterados;
    },

    /**
     * Sanitiza dados para remover informacoes sensiveis antes de logar
     * @param {Object} dados - Dados a serem sanitizados
     * @returns {Object}
     */
    sanitizarDados(dados) {
        if (!dados) return null;

        const dadosSanitizados = { ...dados };
        const camposSensiveis = [
            'senha', 'password', 'token', 'refreshToken', 'accessToken',
            'tokenVerificacaoEmail', 'tokenResetSenha', 'otpCode',
            'fotoPerfil' // Muito grande para log
        ];

        for (const campo of camposSensiveis) {
            if (dadosSanitizados[campo]) {
                dadosSanitizados[campo] = '[REDACTED]';
            }
        }

        // Converte ObjectId para string se necessario
        if (dadosSanitizados._id) {
            dadosSanitizados._id = dadosSanitizados._id.toString();
        }

        return dadosSanitizados;
    },

    // ============================================
    // METODOS DE CONVENIENCIA POR CATEGORIA
    // ============================================

    /**
     * Registra log de autenticacao
     */
    async logAuth(req, acao, descricao, opcoes = {}) {
        const contexto = this.extrairContexto(req);
        return this.registrar({
            ...contexto,
            acao,
            categoria: 'AUTH',
            nivel: opcoes.nivel || (opcoes.sucesso === false ? 'WARN' : 'INFO'),
            recurso: 'Auth',
            recursoId: opcoes.usuarioId || contexto.usuarioId,
            recursoNome: opcoes.usuarioNome || contexto.usuarioNome,
            descricao,
            sucesso: opcoes.sucesso !== undefined ? opcoes.sucesso : true,
            mensagemErro: opcoes.mensagemErro,
            metadados: opcoes.metadados
        });
    },

    /**
     * Registra log de operacao CRUD
     */
    async logCrud(req, acao, categoria, recurso, opcoes = {}) {
        const contexto = this.extrairContexto(req);

        // Detecta alteracoes se houver dados antes e depois
        let camposAlterados = opcoes.camposAlterados || [];
        if (opcoes.dadosAnteriores && opcoes.dadosNovos) {
            camposAlterados = this.detectarAlteracoes(opcoes.dadosAnteriores, opcoes.dadosNovos);
        }

        return this.registrar({
            ...contexto,
            acao,
            categoria,
            nivel: opcoes.nivel || this.determinarNivel(acao),
            recurso,
            recursoId: opcoes.recursoId,
            recursoNome: opcoes.recursoNome,
            descricao: opcoes.descricao || this.gerarDescricao(acao, recurso, opcoes.recursoNome),
            dadosAnteriores: this.sanitizarDados(opcoes.dadosAnteriores),
            dadosNovos: this.sanitizarDados(opcoes.dadosNovos),
            camposAlterados,
            sucesso: opcoes.sucesso !== undefined ? opcoes.sucesso : true,
            mensagemErro: opcoes.mensagemErro,
            metadados: opcoes.metadados
        });
    },

    /**
     * Determina o nivel de criticidade baseado na acao
     */
    determinarNivel(acao) {
        const acoesCriticas = ['EXCLUIR', 'ALTERAR_PERMISSOES', 'SENHA_RESET', 'DESATIVAR'];
        const acoesAtencao = ['ATUALIZAR', 'ATIVAR', 'ALTERAR_PERFIL', 'SENHA_ALTERADA'];

        if (acoesCriticas.includes(acao)) return 'CRITICAL';
        if (acoesAtencao.includes(acao)) return 'WARN';
        return 'INFO';
    },

    /**
     * Gera descricao padrao para a acao
     */
    gerarDescricao(acao, recurso, recursoNome) {
        const acaoTexto = {
            'CRIAR': 'criou',
            'ATUALIZAR': 'atualizou',
            'EXCLUIR': 'excluiu',
            'VISUALIZAR': 'visualizou',
            'ATIVAR': 'ativou',
            'DESATIVAR': 'desativou',
            'ALTERAR_PERMISSOES': 'alterou permissoes de',
            'ALTERAR_PERFIL': 'alterou perfil de',
            'SINCRONIZAR': 'sincronizou',
            'SINCRONIZAR_LOTE': 'sincronizou em lote'
        };

        const texto = acaoTexto[acao] || acao.toLowerCase();
        const nome = recursoNome ? ` "${recursoNome}"` : '';
        return `${texto} ${recurso}${nome}`;
    },

    // ============================================
    // METODOS DE CONSULTA
    // ============================================

    /**
     * Busca logs de auditoria com filtros
     * @param {Object} filtros - Filtros de busca
     * @param {Object} opcoes - Opcoes de paginacao e ordenacao
     */
    async buscar(filtros = {}, opcoes = {}) {
        const {
            pagina = 1,
            limite = 50,
            ordenarPor = 'createdAt',
            ordem = 'desc'
        } = opcoes;

        const query = {};

        // Aplica filtros
        if (filtros.usuarioId) query.usuarioId = filtros.usuarioId;
        if (filtros.categoria) query.categoria = filtros.categoria;
        if (filtros.acao) query.acao = filtros.acao;
        if (filtros.recurso) query.recurso = filtros.recurso;
        if (filtros.recursoId) query.recursoId = filtros.recursoId;
        if (filtros.nivel) query.nivel = filtros.nivel;
        if (filtros.sucesso !== undefined) query.sucesso = filtros.sucesso;

        // Filtro de data
        if (filtros.dataInicio || filtros.dataFim) {
            query.createdAt = {};
            if (filtros.dataInicio) query.createdAt.$gte = new Date(filtros.dataInicio);
            if (filtros.dataFim) query.createdAt.$lte = new Date(filtros.dataFim);
        }

        // Busca textual na descricao
        if (filtros.busca) {
            query.$or = [
                { descricao: { $regex: filtros.busca, $options: 'i' } },
                { usuarioNome: { $regex: filtros.busca, $options: 'i' } },
                { recursoNome: { $regex: filtros.busca, $options: 'i' } }
            ];
        }

        const skip = (pagina - 1) * limite;
        const ordenacao = { [ordenarPor]: ordem === 'desc' ? -1 : 1 };

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .populate('usuarioId', 'usuario nome email')
                .sort(ordenacao)
                .skip(skip)
                .limit(limite)
                .lean(),
            AuditLog.countDocuments(query)
        ]);

        return {
            logs,
            paginacao: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite)
            }
        };
    },

    /**
     * Busca logs de um recurso especifico (historico)
     */
    async buscarHistorico(recurso, recursoId, limite = 50) {
        return AuditLog.find({ recurso, recursoId })
            .populate('usuarioId', 'usuario nome email')
            .sort({ createdAt: -1 })
            .limit(limite)
            .lean();
    },

    /**
     * Busca logs de um usuario especifico
     */
    async buscarPorUsuario(usuarioId, limite = 100) {
        return AuditLog.find({ usuarioId })
            .sort({ createdAt: -1 })
            .limit(limite)
            .lean();
    },

    /**
     * Estatisticas de auditoria
     */
    async estatisticas(periodo = 30) {
        const dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - periodo);

        const [
            totalLogs,
            porCategoria,
            porAcao,
            porNivel,
            porDia,
            falhas
        ] = await Promise.all([
            // Total de logs no periodo
            AuditLog.countDocuments({ createdAt: { $gte: dataInicio } }),

            // Agrupado por categoria
            AuditLog.aggregate([
                { $match: { createdAt: { $gte: dataInicio } } },
                { $group: { _id: '$categoria', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Agrupado por acao
            AuditLog.aggregate([
                { $match: { createdAt: { $gte: dataInicio } } },
                { $group: { _id: '$acao', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            // Agrupado por nivel
            AuditLog.aggregate([
                { $match: { createdAt: { $gte: dataInicio } } },
                { $group: { _id: '$nivel', count: { $sum: 1 } } }
            ]),

            // Por dia
            AuditLog.aggregate([
                { $match: { createdAt: { $gte: dataInicio } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // Falhas recentes
            AuditLog.find({ sucesso: false, createdAt: { $gte: dataInicio } })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean()
        ]);

        return {
            periodo: `${periodo} dias`,
            totalLogs,
            porCategoria: porCategoria.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            porAcao: porAcao.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            porNivel: porNivel.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            porDia,
            falhasRecentes: falhas
        };
    }
};

module.exports = auditService;
