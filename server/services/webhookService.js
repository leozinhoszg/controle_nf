const { Webhook, Fornecedor, Contrato, Sequencia } = require('../models');

const webhookService = {
    // Disparar webhook para URLs registradas
    async dispatch(evento, dados) {
        try {
            const webhooks = await Webhook.find({
                ativo: true,
                eventos: evento
            });

            const resultados = await Promise.allSettled(
                webhooks.map(async (webhook) => {
                    try {
                        const response = await fetch(webhook.url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                evento,
                                timestamp: new Date().toISOString(),
                                dados
                            })
                        });

                        if (response.ok) {
                            webhook.ultimoDisparo = new Date();
                            webhook.falhasConsecutivas = 0;
                            await webhook.save();
                            return { webhook: webhook.nome, status: 'sucesso' };
                        } else {
                            throw new Error(`HTTP ${response.status}`);
                        }
                    } catch (error) {
                        webhook.falhasConsecutivas += 1;
                        // Desativar apos 5 falhas consecutivas
                        if (webhook.falhasConsecutivas >= 5) {
                            webhook.ativo = false;
                        }
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

    // Verificar NFs atrasadas e disparar alertas
    async verificarAtrasadas() {
        try {
            const sequencias = await Sequencia.find()
                .populate({
                    path: 'contrato',
                    populate: { path: 'fornecedor', select: 'nome' }
                });

            const hoje = new Date();
            const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
            const diaAtual = hoje.getDate();

            const atrasadas = [];
            const pendentes = [];

            sequencias.forEach(seq => {
                if (!seq.contrato || !seq.contrato.fornecedor) return;

                const statusSalvo = seq.statusMensal?.get(mesAtual);
                if (statusSalvo === 'ok') return;

                const item = {
                    sequenciaId: seq._id,
                    fornecedor: seq.contrato.fornecedor.nome,
                    contrato: seq.contrato.numero,
                    estabelecimento: seq.contrato.estabelecimento,
                    sequencia: seq.numero,
                    diaEmissao: seq.diaEmissao,
                    custo: seq.custo,
                    mes: mesAtual
                };

                if (diaAtual >= seq.diaEmissao) {
                    atrasadas.push(item);
                } else {
                    pendentes.push(item);
                }
            });

            // Disparar webhooks
            if (atrasadas.length > 0) {
                await this.dispatch('nf_atrasada', {
                    total: atrasadas.length,
                    itens: atrasadas
                });
            }

            if (pendentes.length > 0) {
                await this.dispatch('nf_pendente', {
                    total: pendentes.length,
                    itens: pendentes
                });
            }

            return { atrasadas: atrasadas.length, pendentes: pendentes.length };
        } catch (error) {
            console.error('Erro ao verificar atrasadas:', error);
            throw error;
        }
    },

    // Disparar resumo diario
    async enviarResumoDiario() {
        try {
            const [fornecedores, contratos, sequencias] = await Promise.all([
                Fornecedor.countDocuments(),
                Contrato.countDocuments(),
                Sequencia.find().populate({
                    path: 'contrato',
                    populate: { path: 'fornecedor', select: 'nome' }
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
                const statusSalvo = seq.statusMensal?.get(mesAtual);
                if (statusSalvo === 'ok') return;

                if (diaAtual >= seq.diaEmissao) {
                    atrasadas++;
                    valorTotalAtrasadas += seq.custo;
                } else {
                    pendentes++;
                }
            });

            const resumo = {
                data: hoje.toISOString().split('T')[0],
                fornecedores,
                contratos,
                sequencias: sequencias.length,
                pendentes,
                atrasadas,
                valorTotalAtrasadas
            };

            await this.dispatch('resumo_diario', resumo);

            return resumo;
        } catch (error) {
            console.error('Erro ao enviar resumo diario:', error);
            throw error;
        }
    },

    // Notificar mudanca de status
    async notificarMudancaStatus(sequencia, mesKey, novoStatus) {
        try {
            await sequencia.populate({
                path: 'contrato',
                populate: { path: 'fornecedor', select: 'nome' }
            });

            await this.dispatch('nf_status_alterado', {
                sequenciaId: sequencia._id,
                fornecedor: sequencia.contrato?.fornecedor?.nome,
                contrato: sequencia.contrato?.numero,
                sequencia: sequencia.numero,
                mes: mesKey,
                novoStatus,
                custo: sequencia.custo
            });
        } catch (error) {
            console.error('Erro ao notificar mudanca de status:', error);
        }
    }
};

module.exports = webhookService;
