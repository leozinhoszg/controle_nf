// Cliente API para comunicação com o backend

const API = {
    BASE_URL: '/api',

    // Helper para fazer requisições
    async request(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error(`Erro na API [${endpoint}]:`, error);
            throw error;
        }
    },

    // ==================== FORNECEDORES ====================

    async getFornecedores() {
        return this.request('/fornecedores');
    },

    async getFornecedor(id) {
        return this.request(`/fornecedores/${id}`);
    },

    async createFornecedor(nome) {
        return this.request('/fornecedores', {
            method: 'POST',
            body: { nome }
        });
    },

    async updateFornecedor(id, nome) {
        return this.request(`/fornecedores/${id}`, {
            method: 'PUT',
            body: { nome }
        });
    },

    async deleteFornecedor(id) {
        return this.request(`/fornecedores/${id}`, {
            method: 'DELETE'
        });
    },

    // ==================== CONTRATOS ====================

    async getContratos(fornecedorId = null) {
        const query = fornecedorId ? `?fornecedor=${fornecedorId}` : '';
        return this.request(`/contratos${query}`);
    },

    async getContrato(id) {
        return this.request(`/contratos/${id}`);
    },

    async createContrato(data) {
        return this.request('/contratos', {
            method: 'POST',
            body: data
        });
    },

    async updateContrato(id, data) {
        return this.request(`/contratos/${id}`, {
            method: 'PUT',
            body: data
        });
    },

    async deleteContrato(id) {
        return this.request(`/contratos/${id}`, {
            method: 'DELETE'
        });
    },

    // ==================== SEQUÊNCIAS ====================

    async getSequencias(contratoId = null) {
        const query = contratoId ? `?contrato=${contratoId}` : '';
        return this.request(`/sequencias${query}`);
    },

    async getSequencia(id) {
        return this.request(`/sequencias/${id}`);
    },

    async createSequencia(data) {
        return this.request('/sequencias', {
            method: 'POST',
            body: data
        });
    },

    async updateSequencia(id, data) {
        return this.request(`/sequencias/${id}`, {
            method: 'PUT',
            body: data
        });
    },

    async updateSequenciaStatus(id, monthKey, status) {
        return this.request(`/sequencias/${id}/status`, {
            method: 'PATCH',
            body: { monthKey, status }
        });
    },

    async deleteSequencia(id) {
        return this.request(`/sequencias/${id}`, {
            method: 'DELETE'
        });
    },

    // ==================== RELATÓRIO ====================

    async getTableData() {
        return this.request('/relatorio/tabela');
    },

    async getResumo() {
        return this.request('/relatorio/resumo');
    },

    async loadSampleData() {
        return this.request('/relatorio/seed', {
            method: 'POST'
        });
    },

    // ==================== HEALTH CHECK ====================

    async isAvailable() {
        try {
            await this.request('/relatorio/resumo');
            return true;
        } catch {
            return false;
        }
    }
};

window.API = API;
