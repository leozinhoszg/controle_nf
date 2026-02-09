const { AuditLog, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

const auditService = {
    async registrar(dados) {
        try {
            const log = await AuditLog.create({
                usuario_id: dados.usuarioId || null,
                usuario_nome: dados.usuarioNome || 'Sistema',
                usuario_email: dados.usuarioEmail || null,
                acao: dados.acao,
                categoria: dados.categoria,
                nivel: dados.nivel || 'INFO',
                recurso: dados.recurso,
                recurso_id: dados.recursoId || null,
                recurso_nome: dados.recursoNome || null,
                descricao: dados.descricao,
                dados_anteriores: dados.dadosAnteriores || null,
                dados_novos: dados.dadosNovos || null,
                campos_alterados: dados.camposAlterados || [],
                endereco_ip: dados.enderecoIp || null,
                user_agent: dados.userAgent || null,
                sucesso: dados.sucesso !== undefined ? dados.sucesso : true,
                mensagem_erro: dados.mensagemErro || null,
                metadados: dados.metadados || {}
            });
            return log;
        } catch (error) {
            console.error('Erro ao registrar log de auditoria:', error);
            return null;
        }
    },

    extrairContexto(req) {
        return {
            enderecoIp: this.extrairIpReal(req),
            userAgent: req.get('User-Agent') || null,
            usuarioId: req.user?.id || null,
            usuarioNome: req.user?.usuario || req.user?.nome || 'Sistema',
            usuarioEmail: req.user?.email || null
        };
    },

    extrairIpReal(req) {
        const xForwardedFor = req.headers['x-forwarded-for'];
        const xRealIp = req.headers['x-real-ip'];
        const cfConnectingIp = req.headers['cf-connecting-ip'];

        let ip = null;
        if (xForwardedFor) {
            ip = xForwardedFor.split(',')[0].trim();
        } else if (xRealIp) {
            ip = xRealIp;
        } else if (cfConnectingIp) {
            ip = cfConnectingIp;
        } else {
            ip = req.ip || req.connection?.remoteAddress || null;
        }

        if (ip && ip.startsWith('::ffff:')) {
            ip = ip.substring(7);
        }
        return ip;
    },

    detectarAlteracoes(antes, depois) {
        const camposAlterados = [];
        const todasChaves = new Set([...Object.keys(antes || {}), ...Object.keys(depois || {})]);

        for (const chave of todasChaves) {
            if (['senha', 'id', 'created_at', 'updated_at', 'token_verificacao_email',
                 'token_verificacao_expira', 'token_reset_senha', 'token_reset_expira',
                 'otp_code', 'otp_expira'].includes(chave)) {
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

    sanitizarDados(dados) {
        if (!dados) return null;
        const dadosSanitizados = { ...dados };
        const camposSensiveis = [
            'senha', 'password', 'token', 'refreshToken', 'accessToken',
            'token_verificacao_email', 'token_reset_senha', 'otp_code',
            'foto_perfil'
        ];
        for (const campo of camposSensiveis) {
            if (dadosSanitizados[campo]) {
                dadosSanitizados[campo] = '[REDACTED]';
            }
        }
        return dadosSanitizados;
    },

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

    async logCrud(req, acao, categoria, recurso, opcoes = {}) {
        const contexto = this.extrairContexto(req);
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

    determinarNivel(acao) {
        const acoesCriticas = ['EXCLUIR', 'ALTERAR_PERMISSOES', 'SENHA_RESET', 'DESATIVAR'];
        const acoesAtencao = ['ATUALIZAR', 'ATIVAR', 'ALTERAR_PERFIL', 'SENHA_ALTERADA'];
        if (acoesCriticas.includes(acao)) return 'CRITICAL';
        if (acoesAtencao.includes(acao)) return 'WARN';
        return 'INFO';
    },

    gerarDescricao(acao, recurso, recursoNome) {
        const acaoTexto = {
            'CRIAR': 'criou', 'ATUALIZAR': 'atualizou', 'EXCLUIR': 'excluiu',
            'VISUALIZAR': 'visualizou', 'ATIVAR': 'ativou', 'DESATIVAR': 'desativou',
            'ALTERAR_PERMISSOES': 'alterou permissoes de', 'ALTERAR_PERFIL': 'alterou perfil de',
            'SINCRONIZAR': 'sincronizou', 'SINCRONIZAR_LOTE': 'sincronizou em lote'
        };
        const texto = acaoTexto[acao] || acao.toLowerCase();
        const nome = recursoNome ? ` "${recursoNome}"` : '';
        return `${texto} ${recurso}${nome}`;
    },

    async buscar(filtros = {}, opcoes = {}) {
        const { pagina = 1, limite = 50, ordenarPor = 'created_at', ordem = 'desc' } = opcoes;

        const where = {};
        if (filtros.usuarioId) where.usuario_id = filtros.usuarioId;
        if (filtros.categoria) where.categoria = filtros.categoria;
        if (filtros.acao) where.acao = filtros.acao;
        if (filtros.recurso) where.recurso = filtros.recurso;
        if (filtros.recursoId) where.recurso_id = filtros.recursoId;
        if (filtros.nivel) where.nivel = filtros.nivel;
        if (filtros.sucesso !== undefined) where.sucesso = filtros.sucesso;

        if (filtros.dataInicio || filtros.dataFim) {
            where.created_at = {};
            if (filtros.dataInicio) where.created_at[Op.gte] = new Date(filtros.dataInicio);
            if (filtros.dataFim) where.created_at[Op.lte] = new Date(filtros.dataFim);
        }

        if (filtros.busca) {
            where[Op.or] = [
                { descricao: { [Op.like]: `%${filtros.busca}%` } },
                { usuario_nome: { [Op.like]: `%${filtros.busca}%` } },
                { recurso_nome: { [Op.like]: `%${filtros.busca}%` } }
            ];
        }

        const offset = (pagina - 1) * limite;

        const [logs, total] = await Promise.all([
            AuditLog.findAll({
                where,
                include: [{ model: User.unscoped(), as: 'usuario', attributes: ['id', 'usuario', 'nome', 'email'], required: false }],
                order: [[ordenarPor, ordem.toUpperCase()]],
                offset,
                limit: limite
            }),
            AuditLog.count({ where })
        ]);

        return {
            logs: logs.map(l => l.get({ plain: true })),
            paginacao: { pagina, limite, total, totalPaginas: Math.ceil(total / limite) }
        };
    },

    async buscarHistorico(recurso, recursoId, limite = 50) {
        const logs = await AuditLog.findAll({
            where: { recurso, recurso_id: recursoId },
            include: [{ model: User.unscoped(), as: 'usuario', attributes: ['id', 'usuario', 'nome', 'email'], required: false }],
            order: [['created_at', 'DESC']],
            limit: limite
        });
        return logs.map(l => l.get({ plain: true }));
    },

    async buscarPorUsuario(usuarioId, limite = 100) {
        const logs = await AuditLog.findAll({
            where: { usuario_id: usuarioId },
            order: [['created_at', 'DESC']],
            limit: limite
        });
        return logs.map(l => l.get({ plain: true }));
    },

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
            AuditLog.count({ where: { created_at: { [Op.gte]: dataInicio } } }),

            AuditLog.findAll({
                where: { created_at: { [Op.gte]: dataInicio } },
                attributes: ['categoria', [fn('COUNT', col('id')), 'count']],
                group: ['categoria'],
                order: [[fn('COUNT', col('id')), 'DESC']],
                raw: true
            }),

            AuditLog.findAll({
                where: { created_at: { [Op.gte]: dataInicio } },
                attributes: ['acao', [fn('COUNT', col('id')), 'count']],
                group: ['acao'],
                order: [[fn('COUNT', col('id')), 'DESC']],
                limit: 10,
                raw: true
            }),

            AuditLog.findAll({
                where: { created_at: { [Op.gte]: dataInicio } },
                attributes: ['nivel', [fn('COUNT', col('id')), 'count']],
                group: ['nivel'],
                raw: true
            }),

            AuditLog.findAll({
                where: { created_at: { [Op.gte]: dataInicio } },
                attributes: [
                    [fn('DATE_FORMAT', col('created_at'), '%Y-%m-%d'), 'dia'],
                    [fn('COUNT', col('id')), 'count']
                ],
                group: [fn('DATE_FORMAT', col('created_at'), '%Y-%m-%d')],
                order: [[fn('DATE_FORMAT', col('created_at'), '%Y-%m-%d'), 'ASC']],
                raw: true
            }),

            AuditLog.findAll({
                where: { sucesso: false, created_at: { [Op.gte]: dataInicio } },
                order: [['created_at', 'DESC']],
                limit: 10
            }).then(logs => logs.map(l => l.get({ plain: true })))
        ]);

        return {
            periodo: `${periodo} dias`,
            totalLogs,
            porCategoria: porCategoria.reduce((acc, item) => { acc[item.categoria] = parseInt(item.count); return acc; }, {}),
            porAcao: porAcao.reduce((acc, item) => { acc[item.acao] = parseInt(item.count); return acc; }, {}),
            porNivel: porNivel.reduce((acc, item) => { acc[item.nivel] = parseInt(item.count); return acc; }, {}),
            porDia: porDia.map(item => ({ _id: item.dia, count: parseInt(item.count) })),
            falhasRecentes: falhas
        };
    }
};

module.exports = auditService;
