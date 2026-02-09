const { Webhook, WebhookEvento } = require('../models');
const webhookService = require('../services/webhookService');

// Include padrao para eventos
const eventosInclude = [{ model: WebhookEvento, as: 'eventosRef' }];

// Helper para formatar webhook com eventos como array
const formatWebhook = (webhook) => {
    if (!webhook) return null;
    const plain = webhook.toJSON ? webhook.toJSON() : webhook;
    return {
        ...plain,
        eventos: plain.eventosRef ? plain.eventosRef.map(e => e.evento) : [],
        eventosRef: undefined
    };
};

// Listar todos os webhooks
exports.getAll = async (req, res) => {
    try {
        const webhooks = await Webhook.findAll({
            include: eventosInclude,
            order: [['created_at', 'DESC']]
        });
        res.json(webhooks.map(formatWebhook));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar webhook por ID
exports.getById = async (req, res) => {
    try {
        const webhook = await Webhook.findByPk(req.params.id, {
            include: eventosInclude
        });
        if (!webhook) {
            return res.status(404).json({ message: 'Webhook nao encontrado' });
        }
        res.json(formatWebhook(webhook));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Criar novo webhook (registrar URL do n8n)
exports.create = async (req, res) => {
    try {
        const webhook = await Webhook.create({
            nome: req.body.nome,
            url: req.body.url,
            ativo: req.body.ativo !== false
        });

        // Criar eventos no junction table
        const eventos = req.body.eventos || ['nf_atrasada'];
        if (eventos.length > 0) {
            await WebhookEvento.bulkCreate(
                eventos.map(e => ({ webhook_id: webhook.id, evento: e }))
            );
        }

        // Recarregar com eventos
        const webhookCompleto = await Webhook.findByPk(webhook.id, {
            include: eventosInclude
        });

        res.status(201).json(formatWebhook(webhookCompleto));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar webhook
exports.update = async (req, res) => {
    try {
        const webhook = await Webhook.findByPk(req.params.id);
        if (!webhook) {
            return res.status(404).json({ message: 'Webhook nao encontrado' });
        }

        const updateData = {};
        if (req.body.nome) updateData.nome = req.body.nome;
        if (req.body.url) updateData.url = req.body.url;
        if (req.body.ativo !== undefined) updateData.ativo = req.body.ativo;

        await webhook.update(updateData);

        // Atualizar eventos se fornecidos
        if (req.body.eventos) {
            // Deletar eventos antigos
            await WebhookEvento.destroy({ where: { webhook_id: req.params.id } });
            // Criar novos eventos
            if (req.body.eventos.length > 0) {
                await WebhookEvento.bulkCreate(
                    req.body.eventos.map(e => ({ webhook_id: req.params.id, evento: e }))
                );
            }
        }

        // Recarregar com eventos
        const webhookAtualizado = await Webhook.findByPk(req.params.id, {
            include: eventosInclude
        });

        res.json(formatWebhook(webhookAtualizado));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir webhook
exports.delete = async (req, res) => {
    try {
        const webhook = await Webhook.findByPk(req.params.id);
        if (!webhook) {
            return res.status(404).json({ message: 'Webhook nao encontrado' });
        }

        // Excluir eventos do junction table
        await WebhookEvento.destroy({ where: { webhook_id: req.params.id } });

        // Excluir webhook
        await Webhook.destroy({ where: { id: req.params.id } });

        res.json({ message: 'Webhook excluido com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Testar webhook (dispara um evento de teste)
exports.testar = async (req, res) => {
    try {
        const webhook = await Webhook.findByPk(req.params.id);
        if (!webhook) {
            return res.status(404).json({ message: 'Webhook nao encontrado' });
        }

        const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                evento: 'teste',
                timestamp: new Date().toISOString(),
                dados: {
                    mensagem: 'Este e um teste de webhook do Sistema de Controle de Contratos',
                    webhook: webhook.nome
                }
            })
        });

        if (response.ok) {
            webhook.ultimo_disparo = new Date();
            webhook.falhas_consecutivas = 0;
            await webhook.save();
            res.json({ message: 'Webhook testado com sucesso', status: response.status });
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao testar webhook', erro: error.message });
    }
};

// Disparar verificacao manual de NFs atrasadas
exports.verificarAtrasadas = async (req, res) => {
    try {
        const resultado = await webhookService.verificarAtrasadas();
        res.json({
            message: 'Verificacao concluida',
            ...resultado
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Disparar resumo diario manual
exports.enviarResumo = async (req, res) => {
    try {
        const resumo = await webhookService.enviarResumoDiario();
        res.json({
            message: 'Resumo enviado',
            ...resumo
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Listar eventos disponiveis
exports.getEventos = async (req, res) => {
    res.json({
        eventos: [
            { id: 'nf_atrasada', descricao: 'Disparado quando ha NFs atrasadas' },
            { id: 'nf_pendente', descricao: 'Disparado quando ha NFs pendentes no mes' },
            { id: 'nf_status_alterado', descricao: 'Disparado quando o status de uma NF muda' },
            { id: 'contrato_vencendo', descricao: 'Disparado quando um contrato esta proximo do vencimento' },
            { id: 'resumo_diario', descricao: 'Resumo diario com totais do sistema' }
        ]
    });
};
