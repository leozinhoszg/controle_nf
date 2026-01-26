// Gerenciamento de Dados do Sistema de Controle de Contratos
// Suporta API (MongoDB) com fallback para localStorage

const DataManager = {
    STORAGE_KEY: 'controle_contratos_data',
    useAPI: false, // Será definido na inicialização

    // Verificar se API está disponível
    async checkAPI() {
        try {
            if (typeof API !== 'undefined') {
                this.useAPI = await API.isAvailable();
            }
        } catch {
            this.useAPI = false;
        }
        console.log(`Modo: ${this.useAPI ? 'API (MongoDB)' : 'LocalStorage'}`);
        return this.useAPI;
    },

    // ==================== LOCAL STORAGE ====================

    getInitialData() {
        return {
            fornecedores: [],
            contratos: [],
            sequencias: [],
            lastUpdated: new Date().toISOString()
        };
    },

    loadLocal() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
        }
        return this.getInitialData();
    },

    saveLocal(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Erro ao salvar dados:', e);
            return false;
        }
    },

    // ==================== FORNECEDORES ====================

    async getFornecedores() {
        if (this.useAPI) {
            return await API.getFornecedores();
        }
        return this.loadLocal().fornecedores;
    },

    async getFornecedor(id) {
        if (this.useAPI) {
            return await API.getFornecedor(id);
        }
        return this.loadLocal().fornecedores.find(f => f.id === id);
    },

    async addFornecedor(nome) {
        if (this.useAPI) {
            return await API.createFornecedor(nome);
        }
        const data = this.loadLocal();
        const fornecedor = {
            id: Utils.generateId(),
            nome: nome.trim().toUpperCase(),
            createdAt: new Date().toISOString()
        };
        data.fornecedores.push(fornecedor);
        this.saveLocal(data);
        return fornecedor;
    },

    async updateFornecedor(id, nome) {
        if (this.useAPI) {
            return await API.updateFornecedor(id, nome);
        }
        const data = this.loadLocal();
        const index = data.fornecedores.findIndex(f => f.id === id);
        if (index !== -1) {
            data.fornecedores[index].nome = nome.trim().toUpperCase();
            data.fornecedores[index].updatedAt = new Date().toISOString();
            this.saveLocal(data);
            return data.fornecedores[index];
        }
        return null;
    },

    async deleteFornecedor(id) {
        if (this.useAPI) {
            return await API.deleteFornecedor(id);
        }
        const data = this.loadLocal();
        const contratos = data.contratos.filter(c => c.fornecedorId === id);
        contratos.forEach(contrato => {
            data.sequencias = data.sequencias.filter(s => s.contratoId !== contrato.id);
        });
        data.contratos = data.contratos.filter(c => c.fornecedorId !== id);
        data.fornecedores = data.fornecedores.filter(f => f.id !== id);
        this.saveLocal(data);
        return true;
    },

    // ==================== CONTRATOS ====================

    async getContratos(fornecedorId = null) {
        if (this.useAPI) {
            return await API.getContratos(fornecedorId);
        }
        const contratos = this.loadLocal().contratos;
        if (fornecedorId) {
            return contratos.filter(c => c.fornecedorId === fornecedorId);
        }
        return contratos;
    },

    async getContrato(id) {
        if (this.useAPI) {
            return await API.getContrato(id);
        }
        return this.loadLocal().contratos.find(c => c.id === id);
    },

    async addContrato(fornecedorId, numero, estabelecimento, observacao = '') {
        if (this.useAPI) {
            return await API.createContrato({
                fornecedor: fornecedorId,
                numero: parseInt(numero),
                estabelecimento: parseInt(estabelecimento) || 1,
                observacao
            });
        }
        const data = this.loadLocal();
        const contrato = {
            id: Utils.generateId(),
            fornecedorId,
            numero: parseInt(numero),
            estabelecimento: parseInt(estabelecimento),
            observacao,
            createdAt: new Date().toISOString()
        };
        data.contratos.push(contrato);
        this.saveLocal(data);
        return contrato;
    },

    async updateContrato(id, updates) {
        if (this.useAPI) {
            const apiUpdates = { ...updates };
            if (updates.fornecedorId) {
                apiUpdates.fornecedor = updates.fornecedorId;
                delete apiUpdates.fornecedorId;
            }
            return await API.updateContrato(id, apiUpdates);
        }
        const data = this.loadLocal();
        const index = data.contratos.findIndex(c => c.id === id);
        if (index !== -1) {
            Object.assign(data.contratos[index], updates, {
                updatedAt: new Date().toISOString()
            });
            this.saveLocal(data);
            return data.contratos[index];
        }
        return null;
    },

    async deleteContrato(id) {
        if (this.useAPI) {
            return await API.deleteContrato(id);
        }
        const data = this.loadLocal();
        data.sequencias = data.sequencias.filter(s => s.contratoId !== id);
        data.contratos = data.contratos.filter(c => c.id !== id);
        this.saveLocal(data);
        return true;
    },

    // ==================== SEQUÊNCIAS ====================

    async getSequencias(contratoId = null) {
        if (this.useAPI) {
            return await API.getSequencias(contratoId);
        }
        const sequencias = this.loadLocal().sequencias;
        if (contratoId) {
            return sequencias.filter(s => s.contratoId === contratoId);
        }
        return sequencias;
    },

    async getSequencia(id) {
        if (this.useAPI) {
            return await API.getSequencia(id);
        }
        return this.loadLocal().sequencias.find(s => s.id === id);
    },

    async addSequencia(contratoId, numero, diaEmissao, custo) {
        if (this.useAPI) {
            return await API.createSequencia({
                contrato: contratoId,
                numero: parseInt(numero),
                diaEmissao: parseInt(diaEmissao),
                custo: parseFloat(custo)
            });
        }
        const data = this.loadLocal();
        const sequencia = {
            id: Utils.generateId(),
            contratoId,
            numero: parseInt(numero),
            diaEmissao: parseInt(diaEmissao),
            custo: parseFloat(custo),
            statusMensal: {},
            createdAt: new Date().toISOString()
        };
        data.sequencias.push(sequencia);
        this.saveLocal(data);
        return sequencia;
    },

    async updateSequencia(id, updates) {
        if (this.useAPI) {
            const apiUpdates = { ...updates };
            if (updates.contratoId) {
                apiUpdates.contrato = updates.contratoId;
                delete apiUpdates.contratoId;
            }
            return await API.updateSequencia(id, apiUpdates);
        }
        const data = this.loadLocal();
        const index = data.sequencias.findIndex(s => s.id === id);
        if (index !== -1) {
            Object.assign(data.sequencias[index], updates, {
                updatedAt: new Date().toISOString()
            });
            this.saveLocal(data);
            return data.sequencias[index];
        }
        return null;
    },

    async updateSequenciaStatus(id, monthKey, status) {
        if (this.useAPI) {
            return await API.updateSequenciaStatus(id, monthKey, status);
        }
        const data = this.loadLocal();
        const index = data.sequencias.findIndex(s => s.id === id);
        if (index !== -1) {
            if (!data.sequencias[index].statusMensal) {
                data.sequencias[index].statusMensal = {};
            }
            data.sequencias[index].statusMensal[monthKey] = status;
            this.saveLocal(data);
            return data.sequencias[index];
        }
        return null;
    },

    async deleteSequencia(id) {
        if (this.useAPI) {
            return await API.deleteSequencia(id);
        }
        const data = this.loadLocal();
        data.sequencias = data.sequencias.filter(s => s.id !== id);
        this.saveLocal(data);
        return true;
    },

    // ==================== CONSULTAS AGREGADAS ====================

    async getTableData() {
        if (this.useAPI) {
            return await API.getTableData();
        }

        const data = this.loadLocal();
        const rows = [];

        data.sequencias.forEach(seq => {
            const contrato = data.contratos.find(c => c.id === seq.contratoId);
            if (!contrato) return;

            const fornecedor = data.fornecedores.find(f => f.id === contrato.fornecedorId);
            if (!fornecedor) return;

            rows.push({
                sequenciaId: seq.id,
                fornecedor: fornecedor.nome,
                fornecedorId: fornecedor.id,
                contrato: contrato.numero,
                contratoId: contrato.id,
                estabelecimento: contrato.estabelecimento,
                sequencia: seq.numero,
                diaEmissao: seq.diaEmissao,
                custo: seq.custo,
                statusMensal: seq.statusMensal || {},
                observacao: contrato.observacao
            });
        });

        rows.sort((a, b) => {
            if (a.fornecedor !== b.fornecedor) return a.fornecedor.localeCompare(b.fornecedor);
            if (a.contrato !== b.contrato) return a.contrato - b.contrato;
            return a.sequencia - b.sequencia;
        });

        return rows;
    },

    async getResumo() {
        if (this.useAPI) {
            return await API.getResumo();
        }

        const tableData = await this.getTableData();
        const fornecedores = await this.getFornecedores();
        const contratos = await this.getContratos();

        const hoje = new Date();
        const mesAtual = Utils.getMonthKey(hoje.getFullYear(), hoje.getMonth());

        let pendentes = 0;
        let atrasadas = 0;

        tableData.forEach(row => {
            const statusSalvo = row.statusMensal[mesAtual];
            if (statusSalvo === 'ok') return;

            const diaAtual = hoje.getDate();
            if (diaAtual < row.diaEmissao) {
                pendentes++;
            } else {
                atrasadas++;
            }
        });

        return {
            fornecedores: fornecedores.length,
            contratos: contratos.length,
            sequencias: tableData.length,
            pendentes,
            atrasadas
        };
    },

    async getPendentes() {
        const tableData = await this.getTableData();
        const currentMonthKey = Utils.getMonthKey(new Date().getFullYear(), new Date().getMonth());
        const pendentes = [];

        tableData.forEach(row => {
            const status = row.statusMensal[currentMonthKey] ||
                          Utils.calculateStatus(row.diaEmissao, currentMonthKey);
            if (status === 'pendente') {
                pendentes.push(row);
            }
        });

        return pendentes;
    },

    async getAtrasadas() {
        const today = new Date();
        const currentMonthKey = Utils.getMonthKey(today.getFullYear(), today.getMonth());
        const tableData = await this.getTableData();
        const atrasadas = [];

        tableData.forEach(row => {
            const months = Utils.getCurrentYearMonths();
            months.forEach(month => {
                if (month.key <= currentMonthKey) {
                    const status = row.statusMensal[month.key] ||
                                  Utils.calculateStatus(row.diaEmissao, month.key);
                    if (status === 'atrasada') {
                        atrasadas.push({
                            ...row,
                            mesAtrasado: month.name,
                            mesKey: month.key
                        });
                    }
                }
            });
        });

        return atrasadas;
    },

    // ==================== IMPORTAR/EXPORTAR ====================

    async exportJSON() {
        if (this.useAPI) {
            const [fornecedores, contratos, sequencias] = await Promise.all([
                this.getFornecedores(),
                this.getContratos(),
                this.getSequencias()
            ]);
            return JSON.stringify({ fornecedores, contratos, sequencias }, null, 2);
        }
        return JSON.stringify(this.loadLocal(), null, 2);
    },

    async importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.fornecedores && data.contratos && data.sequencias) {
                this.saveLocal(data);
                return true;
            }
            throw new Error('Formato invalido');
        } catch (e) {
            console.error('Erro ao importar:', e);
            return false;
        }
    },

    reset() {
        this.saveLocal(this.getInitialData());
    },

    // ==================== DADOS DE EXEMPLO ====================

    async loadSampleData() {
        if (this.useAPI) {
            return await API.loadSampleData();
        }

        const data = this.getInitialData();

        const fornecedores = [
            { id: 'f1', nome: 'DI2S' },
            { id: 'f2', nome: 'CABTEC' },
            { id: 'f3', nome: 'CONTI CONSULTORIA' },
            { id: 'f4', nome: 'VIVO' },
            { id: 'f5', nome: 'BKP GARANTIDO' },
            { id: 'f6', nome: 'SENIOR' }
        ];

        const contratos = [
            { id: 'c1', fornecedorId: 'f1', numero: 310, estabelecimento: 1, observacao: '' },
            { id: 'c2', fornecedorId: 'f2', numero: 474, estabelecimento: 1, observacao: '' },
            { id: 'c3', fornecedorId: 'f3', numero: 684, estabelecimento: 2, observacao: '' },
            { id: 'c4', fornecedorId: 'f4', numero: 236, estabelecimento: 1, observacao: '' },
            { id: 'c5', fornecedorId: 'f5', numero: 593, estabelecimento: 2, observacao: 'Necessario atualizacao de contrato' },
            { id: 'c6', fornecedorId: 'f5', numero: 594, estabelecimento: 1, observacao: 'Necessario atualizacao de contrato' },
            { id: 'c7', fornecedorId: 'f6', numero: 545, estabelecimento: 2, observacao: '' },
            { id: 'c8', fornecedorId: 'f6', numero: 545, estabelecimento: 1, observacao: 'Necessario atualizacao de contrato' }
        ];

        const sequenciasData = [
            { contratoId: 'c1', numero: 1, diaEmissao: 15, custo: 3589.20 },
            { contratoId: 'c1', numero: 2, diaEmissao: 15, custo: 708.15 },
            { contratoId: 'c1', numero: 3, diaEmissao: 15, custo: 436.50 },
            { contratoId: 'c1', numero: 4, diaEmissao: 15, custo: 261.16 },
            { contratoId: 'c1', numero: 5, diaEmissao: 15, custo: 1343.64 },
            { contratoId: 'c1', numero: 11, diaEmissao: 15, custo: 7091.50 },
            { contratoId: 'c2', numero: 12, diaEmissao: 15, custo: 214.50 },
            { contratoId: 'c2', numero: 13, diaEmissao: 15, custo: 195.80 },
            { contratoId: 'c2', numero: 14, diaEmissao: 15, custo: 78.40 },
            { contratoId: 'c2', numero: 15, diaEmissao: 15, custo: 2827.50 },
            { contratoId: 'c2', numero: 16, diaEmissao: 15, custo: 1007.73 },
            { contratoId: 'c2', numero: 17, diaEmissao: 15, custo: 711.00 },
            { contratoId: 'c2', numero: 18, diaEmissao: 15, custo: 4355.80 },
            { contratoId: 'c3', numero: 3, diaEmissao: 3, custo: 6500.00 },
            { contratoId: 'c3', numero: 2, diaEmissao: 3, custo: 2221.31 },
            { contratoId: 'c4', numero: 1, diaEmissao: 18, custo: 6960.00 },
            { contratoId: 'c5', numero: 1, diaEmissao: 1, custo: 1652.63 },
            { contratoId: 'c6', numero: 1, diaEmissao: 1, custo: 1193.93 },
            { contratoId: 'c7', numero: 3, diaEmissao: 6, custo: 478.78 },
            { contratoId: 'c8', numero: 2, diaEmissao: 1, custo: 5692.01 },
            { contratoId: 'c8', numero: 2, diaEmissao: 29, custo: 2012.00 }
        ];

        data.fornecedores = fornecedores.map(f => ({
            ...f,
            createdAt: new Date().toISOString()
        }));

        data.contratos = contratos.map(c => ({
            ...c,
            createdAt: new Date().toISOString()
        }));

        data.sequencias = sequenciasData.map((s, index) => ({
            id: `s${index + 1}`,
            ...s,
            statusMensal: {},
            createdAt: new Date().toISOString()
        }));

        this.saveLocal(data);
        return data;
    },

    async hasData() {
        if (this.useAPI) {
            try {
                const resumo = await API.getResumo();
                return resumo.fornecedores > 0;
            } catch {
                return false;
            }
        }
        const data = this.loadLocal();
        return data.fornecedores.length > 0;
    },

    async initializeIfEmpty() {
        const hasData = await this.hasData();
        if (!hasData) {
            await this.loadSampleData();
            return true;
        }
        return false;
    }
};

window.DataManager = DataManager;
