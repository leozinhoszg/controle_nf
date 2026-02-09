const { Webhook, WebhookEvento, Fornecedor, Contrato, Sequencia } = require('../models');

const webhookService = {
    async dispatch(evento, dados) {
        try {
            const webhooks = await Webhook.findAll({
                where: { ativo: true },
                include: [{ model: WebhookEvento, as: 'eventosRef', where: { evento }, required: true }]
            });

            const resultados = await Promise.allSettled(
                webhooks.map(async (webhook) => {
                    try {
                        const response = await fetch(webhook.url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ evento, timestamp: new Date().toISOString(), dados })
                        });

                        if (response.ok) {
                            webhook.ultimo_disparo = new Date();
                            webhook.falhas_consecutivas = 0;
                            await webhook.save();
                            return { webhook: webhook.nome, status: 'sucesso' };
                        } else {
                            throw new Error(`HTTP ${response.status}`);
                        }
                    } catch (error) {
                        webhook.falhas_consecutivas += 1;
                        if (webhook.falhas_consecutivas >= 5) webhook.ativo = false;
                        await webhook.save();
                        return { webhook: webhook.nome, status: 'erro', erro: error.message };
                    }
                })
            );
            return resultados;
        } catch (error) {
            console.error('Erro ao disparar webhooks:', error);
            throw error;
        }
    },

    async verificarAtrasadas() {
        try {
            const sequencias = await Sequencia.findAll({
                include: [{
                    model: Contrato,
                    as: 'contrato',
                    include: [{ model: Fornecedor, as: 'fornecedor', attributes: ['nome'] }]
                }]
            });

            const hoje = new Date();
            const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
            const diaAtual = hoje.getDate();
            const atrasadas = [];
            const pendentes = [];

            sequencias.forEach(seq => {
                if (!seq.contrato || !seq.contrato.fornecedor) return;
                const statusSalvo = seq.status_mensal?.[mesAtual];
                if (statusSalvo === 'ok') return;

                const item = {
                    sequenciaId: seq.id,
                    fornecedor: seq.contrato.fornecedor.nome,
                    contrato: seq.contrato.nr_contrato,
                    estabelecimento: seq.contrato.cod_estabel,
                    sequencia: seq.num_seq_item,
                    diaEmissao: seq.dia_emissao,
                    valor: seq.valor,
                    mes: mesAtual
                };

                if (diaAtual >= seq.dia_emissao) {
                    atrasadas.push(item);
                } else {
                    pendentes.push(item);
                }
            });

            if (atrasadas.length > 0) {
                await this.dispatch('nf_atrasada', { total: atrasadas.length, itens: atrasadas });
            }
            if (pendentes.length > 0) {
                await this.dispatch('nf_pendente', { total: pendentes.length, itens: pendentes });
            }

            return { atrasadas: atrasadas.length, pendentes: pendentes.length };
        } catch (error) {
            console.error('Erro ao verificar atrasadas:', error);
            throw error;
        }
    },

    async enviarResumoDiario() {
        try {
            const [fornecedores, contratos, sequencias] = await Promise.all([
                Fornecedor.count(),
                Contrato.count(),
                Sequencia.findAll({
                    include: [{
                        model: Contrato,
                        as: 'contrato',
                        include: [{ model: Fornecedor, as: 'fornecedor', attributes: ['nome'] }]
                    }]
                })
            ]);

            const hoje = new Date();
            const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
            const diaAtual = hoje.getDate();
            let pendentes = 0;
            let atrasadas = 0;
            let valorTotalAtrasadas = 0;

            sequencias.forEach(seq => {
                if (!seq.contrato) return;
                const statusSalvo = seq.status_mensal?.[mesAtual];
                if (statusSalvo === 'ok') return;
                if (diaAtual >= seq.dia_emissao) {
                    atrasadas++;
                    valorTotalAtrasadas += seq.valor;
                } else {
                    pendentes++;
                }
            });

            const resumo = {
                data: hoje.toISOString().split('T')[0],
                fornecedores, contratos, sequencias: sequencias.length,
                pendentes, atrasadas, valorTotalAtrasadas
            };

            await this.dispatch('resumo_diario', resumo);
            return resumo;
        } catch (error) {
            console.error('Erro ao enviar resumo diario:', error);
            throw error;
        }
    },

    async notificarMudancaStatus(sequencia, mesKey, novoStatus) {
        try {
            const seq = await Sequencia.findByPk(sequencia.id, {
                include: [{
                    model: Contrato,
                    as: 'contrato',
                    include: [{ model: Fornecedor, as: 'fornecedor', attributes: ['nome'] }]
                }]
            });

            await this.dispatch('nf_status_alterado', {
                sequenciaId: seq.id,
                fornecedor: seq.contrato?.fornecedor?.nome,
                contrato: seq.contrato?.nr_contrato,
                sequencia: seq.num_seq_item,
                mes: mesKey,
                novoStatus,
                valor: seq.valor
            });
        } catch (error) {
            console.error('Erro ao notificar mudanca de status:', error);
        }
    }
};

module.exports = webhookService;
