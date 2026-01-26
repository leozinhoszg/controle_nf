const { Webhook } = require('../models');
const webhookService = require('../services/webhookService');

// Listar todos os webhooks
exports.getAll = async (req, res) => {
    try {
        const webhooks = await Webhook.find().sort({ createdAt: -1 });
        res.json(webhooks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar webhook por ID
exports.getById = async (req, res) => {
    try {
        const webhook = await Webhook.findById(req.params.id);
        if (!webhook) {
            return res.status(404).json({ message: 'Webhook nao encontrado' });
        }
        res.json(webhook);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Criar novo webhook (registrar URL do n8n)
exports.create = async (req, res) => {
    try {
        const webhook = new Webhook({
            nome: req.body.nome,
            url: req.body.url,
            eventos: req.body.eventos || ['nf_atrasada'],
            ativo: req.body.ativo !== false
        });
        const novoWebhook = await webhook.save();
        res.status(201).json(novoWebhook);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar webhook
exports.update = async (req, res) => {
    try {
        const updateData = {};
        if (req.body.nome) updateData.nome = req.body.nome;
        if (req.body.url) updateData.url = req.body.url;
        if (req.body.eventos) updateData.eventos = req.body.eventos;
        if (req.body.ativo !== undefined) updateData.ativo = req.body.ativo;

        const webhook = await Webhook.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!webhook) {
            return res.status(404).json({ message: 'Webhook nao encontrado' });
        }
        res.json(webhook);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir webhook
exports.delete = async (req, res) => {
    try {
        const webhook = await Webhook.findByIdAndDelete(req.params.id);
        if (!webhook) {
            return res.status(404).json({ message: 'Webhook nao encontrado' });
        }
        res.json({ message: 'Webhook excluido com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Testar webhook (dispara um evento de teste)
exports.testar = async (req, res) => {
    try {
        const webhook = await Webhook.findById(req.params.id);
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
            webhook.ultimoDisparo = new Date();
            webhook.falhasConsecutivas = 0;
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
