// Aplicacao Principal - Sistema de Controle de Contratos

const App = {
    currentSection: 'dashboard',
    currentFornecedorId: null,
    currentContratoId: null,
    filterFornecedor: '',
    filterStatus: '',

    // Inicializacao
    async init() {
        // Verificar se API esta disponivel
        await DataManager.checkAPI();

        // Inicializar dados de exemplo se vazio
        await DataManager.initializeIfEmpty();

        // Configurar eventos
        this.setupNavigation();
        this.setupModals();
        this.setupForms();

        // Renderizar secao inicial
        await this.navigateTo('dashboard');
    },

    // ==================== NAVEGACAO ====================

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                if (section) {
                    this.navigateTo(section);
                }
            });
        });
    },

    async navigateTo(section) {
        this.currentSection = section;

        // Atualizar botoes de navegacao
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });

        // Mostrar secao ativa
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.toggle('active', sec.id === `section-${section}`);
        });

        // Renderizar conteudo
        switch (section) {
            case 'dashboard':
                await this.renderDashboard();
                break;
            case 'fornecedores':
                await this.renderFornecedores();
                break;
            case 'contratos':
                await this.renderContratos();
                break;
            case 'relatorio':
                await this.renderRelatorio();
                break;
        }
    },

    // ==================== DASHBOARD ====================

    async renderDashboard() {
        try {
            const [pendentes, atrasadas, fornecedores, contratos] = await Promise.all([
                DataManager.getPendentes(),
                DataManager.getAtrasadas(),
                DataManager.getFornecedores(),
                DataManager.getContratos()
            ]);

            // Atualizar cards de estatisticas
            document.getElementById('stat-pendentes').textContent = pendentes.length;
            document.getElementById('stat-atrasadas').textContent = atrasadas.length;
            document.getElementById('stat-fornecedores').textContent = fornecedores.length;
            document.getElementById('stat-contratos').textContent = contratos.length;

            // Renderizar lista de NFs atrasadas
            const listaAtrasadas = document.getElementById('lista-atrasadas');
            if (atrasadas.length === 0) {
                listaAtrasadas.innerHTML = '<p class="empty-state">Nenhuma NF atrasada</p>';
            } else {
                listaAtrasadas.innerHTML = atrasadas.slice(0, 10).map(item => `
                    <div class="list-item">
                        <div class="list-item-content">
                            <span class="list-item-title">${item.fornecedor} - Contrato ${item.contrato}</span>
                            <span class="list-item-subtitle">Seq. ${item.sequencia} | ${item.mesAtrasado} | ${Utils.formatCurrency(item.custo)}</span>
                        </div>
                        <span class="badge badge-danger">Atrasada</span>
                    </div>
                `).join('');
            }

            // Renderizar lista de NFs pendentes
            const listaPendentes = document.getElementById('lista-pendentes');
            if (pendentes.length === 0) {
                listaPendentes.innerHTML = '<p class="empty-state">Nenhuma NF pendente este mes</p>';
            } else {
                listaPendentes.innerHTML = pendentes.slice(0, 10).map(item => `
                    <div class="list-item">
                        <div class="list-item-content">
                            <span class="list-item-title">${item.fornecedor} - Contrato ${item.contrato}</span>
                            <span class="list-item-subtitle">Seq. ${item.sequencia} | Dia ${item.diaEmissao} | ${Utils.formatCurrency(item.custo)}</span>
                        </div>
                        <span class="badge badge-warning">Pendente</span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Erro ao renderizar dashboard:', error);
            Utils.showToast('Erro ao carregar dashboard', 'error');
        }
    },

    // ==================== FORNECEDORES ====================

    async renderFornecedores() {
        try {
            const fornecedores = await DataManager.getFornecedores();
            const lista = document.getElementById('lista-fornecedores');

            if (fornecedores.length === 0) {
                lista.innerHTML = `
                    <div class="empty-state">
                        <p class="empty-state-title">Nenhum fornecedor cadastrado</p>
                        <p>Clique em "Novo Fornecedor" para adicionar</p>
                    </div>
                `;
                return;
            }

            // Buscar contratos para cada fornecedor
            const fornecedoresComContratos = await Promise.all(
                fornecedores.map(async f => {
                    const contratos = await DataManager.getContratos(f._id || f.id);
                    return { ...f, contratosCount: contratos.length };
                })
            );

            lista.innerHTML = fornecedoresComContratos.map(f => {
                const id = f._id || f.id;
                return `
                    <div class="list-item">
                        <div class="list-item-content">
                            <span class="list-item-title">${f.nome}</span>
                            <span class="list-item-subtitle">${f.contratosCount} contrato(s)</span>
                        </div>
                        <div class="list-item-actions">
                            <button class="btn btn-sm btn-secondary" onclick="App.editFornecedor('${id}')">Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="App.deleteFornecedor('${id}')">Excluir</button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Erro ao renderizar fornecedores:', error);
            Utils.showToast('Erro ao carregar fornecedores', 'error');
        }
    },

    async openFornecedorModal(id = null) {
        this.currentFornecedorId = id;
        const modal = document.getElementById('modal-fornecedor');
        const title = document.getElementById('modal-fornecedor-title');
        const input = document.getElementById('input-fornecedor-nome');

        if (id) {
            const fornecedor = await DataManager.getFornecedor(id);
            title.textContent = 'Editar Fornecedor';
            input.value = fornecedor.nome;
        } else {
            title.textContent = 'Novo Fornecedor';
            input.value = '';
        }

        modal.classList.add('active');
        input.focus();
    },

    async editFornecedor(id) {
        await this.openFornecedorModal(id);
    },

    async saveFornecedor() {
        const nome = document.getElementById('input-fornecedor-nome').value.trim();

        if (!nome) {
            Utils.showToast('Informe o nome do fornecedor', 'error');
            return;
        }

        try {
            if (this.currentFornecedorId) {
                await DataManager.updateFornecedor(this.currentFornecedorId, nome);
                Utils.showToast('Fornecedor atualizado', 'success');
            } else {
                await DataManager.addFornecedor(nome);
                Utils.showToast('Fornecedor cadastrado', 'success');
            }

            this.closeModal('modal-fornecedor');
            await this.renderFornecedores();
        } catch (error) {
            console.error('Erro ao salvar fornecedor:', error);
            Utils.showToast('Erro ao salvar fornecedor', 'error');
        }
    },

    async deleteFornecedor(id) {
        const fornecedor = await DataManager.getFornecedor(id);
        if (Utils.confirm(`Excluir fornecedor "${fornecedor.nome}" e todos os seus contratos?`)) {
            try {
                await DataManager.deleteFornecedor(id);
                Utils.showToast('Fornecedor excluido', 'success');
                await this.renderFornecedores();
            } catch (error) {
                console.error('Erro ao excluir fornecedor:', error);
                Utils.showToast('Erro ao excluir fornecedor', 'error');
            }
        }
    },

    // ==================== CONTRATOS ====================

    async renderContratos() {
        try {
            const fornecedores = await DataManager.getFornecedores();
            const lista = document.getElementById('lista-contratos');
            const selectFornecedor = document.getElementById('select-contrato-fornecedor');

            // Preencher select de fornecedores no modal
            selectFornecedor.innerHTML = '<option value="">Selecione...</option>' +
                fornecedores.map(f => `<option value="${f._id || f.id}">${f.nome}</option>`).join('');

            if (fornecedores.length === 0) {
                lista.innerHTML = `
                    <div class="empty-state">
                        <p class="empty-state-title">Nenhum fornecedor cadastrado</p>
                        <p>Cadastre um fornecedor primeiro</p>
                    </div>
                `;
                return;
            }

            let html = '';
            for (const f of fornecedores) {
                const fId = f._id || f.id;
                const contratos = await DataManager.getContratos(fId);

                html += `<h3 style="margin: 1rem 0 0.5rem; color: var(--text-secondary);">${f.nome}</h3>`;

                if (contratos.length === 0) {
                    html += '<p style="color: var(--text-light); margin-bottom: 1rem;">Nenhum contrato</p>';
                } else {
                    for (const c of contratos) {
                        const cId = c._id || c.id;
                        const sequencias = await DataManager.getSequencias(cId);
                        html += `
                            <div class="list-item" style="margin-bottom: 0.5rem;">
                                <div class="list-item-content">
                                    <span class="list-item-title">Contrato ${c.numero} - Estab. ${c.estabelecimento}</span>
                                    <span class="list-item-subtitle">${sequencias.length} sequencia(s) | ${c.observacao || 'Sem observacao'}</span>
                                </div>
                                <div class="list-item-actions">
                                    <button class="btn btn-sm btn-primary" onclick="App.openSequenciaModal('${cId}')">+ Seq.</button>
                                    <button class="btn btn-sm btn-secondary" onclick="App.editContrato('${cId}')">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="App.deleteContrato('${cId}')">Excluir</button>
                                </div>
                            </div>
                        `;

                        // Mostrar sequencias
                        if (sequencias.length > 0) {
                            html += '<div style="margin-left: 1.5rem; margin-bottom: 1rem;">';
                            for (const s of sequencias) {
                                const sId = s._id || s.id;
                                html += `
                                    <div class="list-item" style="background: var(--bg); margin-bottom: 0.25rem; padding: 0.5rem;">
                                        <div class="list-item-content">
                                            <span class="list-item-subtitle">Seq. ${s.numero} | Dia ${s.diaEmissao} | ${Utils.formatCurrency(s.custo)}</span>
                                        </div>
                                        <div class="list-item-actions">
                                            <button class="btn btn-sm btn-secondary" onclick="App.editSequencia('${sId}')">Editar</button>
                                            <button class="btn btn-sm btn-danger" onclick="App.deleteSequencia('${sId}')">X</button>
                                        </div>
                                    </div>
                                `;
                            }
                            html += '</div>';
                        }
                    }
                }
            }

            lista.innerHTML = html;
        } catch (error) {
            console.error('Erro ao renderizar contratos:', error);
            Utils.showToast('Erro ao carregar contratos', 'error');
        }
    },

    async openContratoModal(id = null) {
        this.currentContratoId = id;
        const modal = document.getElementById('modal-contrato');
        const title = document.getElementById('modal-contrato-title');
        const selectFornecedor = document.getElementById('select-contrato-fornecedor');
        const inputNumero = document.getElementById('input-contrato-numero');
        const inputEstab = document.getElementById('input-contrato-estabelecimento');
        const inputObs = document.getElementById('input-contrato-observacao');

        if (id) {
            const contrato = await DataManager.getContrato(id);
            title.textContent = 'Editar Contrato';
            selectFornecedor.value = contrato.fornecedor?._id || contrato.fornecedor || contrato.fornecedorId;
            inputNumero.value = contrato.numero;
            inputEstab.value = contrato.estabelecimento;
            inputObs.value = contrato.observacao || '';
        } else {
            title.textContent = 'Novo Contrato';
            selectFornecedor.value = '';
            inputNumero.value = '';
            inputEstab.value = '1';
            inputObs.value = '';
        }

        modal.classList.add('active');
    },

    async editContrato(id) {
        await this.openContratoModal(id);
    },

    async saveContrato() {
        const fornecedorId = document.getElementById('select-contrato-fornecedor').value;
        const numero = document.getElementById('input-contrato-numero').value;
        const estabelecimento = document.getElementById('input-contrato-estabelecimento').value;
        const observacao = document.getElementById('input-contrato-observacao').value;

        if (!fornecedorId || !numero) {
            Utils.showToast('Preencha os campos obrigatorios', 'error');
            return;
        }

        try {
            if (this.currentContratoId) {
                await DataManager.updateContrato(this.currentContratoId, {
                    fornecedorId,
                    numero: parseInt(numero),
                    estabelecimento: parseInt(estabelecimento) || 1,
                    observacao
                });
                Utils.showToast('Contrato atualizado', 'success');
            } else {
                await DataManager.addContrato(fornecedorId, numero, estabelecimento || 1, observacao);
                Utils.showToast('Contrato cadastrado', 'success');
            }

            this.closeModal('modal-contrato');
            await this.renderContratos();
        } catch (error) {
            console.error('Erro ao salvar contrato:', error);
            Utils.showToast('Erro ao salvar contrato', 'error');
        }
    },

    async deleteContrato(id) {
        const contrato = await DataManager.getContrato(id);
        if (Utils.confirm(`Excluir contrato ${contrato.numero} e todas as suas sequencias?`)) {
            try {
                await DataManager.deleteContrato(id);
                Utils.showToast('Contrato excluido', 'success');
                await this.renderContratos();
            } catch (error) {
                console.error('Erro ao excluir contrato:', error);
                Utils.showToast('Erro ao excluir contrato', 'error');
            }
        }
    },

    // ==================== SEQUENCIAS ====================

    async openSequenciaModal(contratoId, sequenciaId = null) {
        this.currentContratoId = contratoId;
        this.currentSequenciaId = sequenciaId;

        const modal = document.getElementById('modal-sequencia');
        const title = document.getElementById('modal-sequencia-title');
        const inputNumero = document.getElementById('input-sequencia-numero');
        const inputDia = document.getElementById('input-sequencia-dia');
        const inputCusto = document.getElementById('input-sequencia-custo');

        if (sequenciaId) {
            const sequencia = await DataManager.getSequencia(sequenciaId);
            title.textContent = 'Editar Sequencia';
            inputNumero.value = sequencia.numero;
            inputDia.value = sequencia.diaEmissao;
            inputCusto.value = sequencia.custo;
        } else {
            title.textContent = 'Nova Sequencia';
            inputNumero.value = '';
            inputDia.value = '15';
            inputCusto.value = '';
        }

        modal.classList.add('active');
    },

    async editSequencia(id) {
        const sequencia = await DataManager.getSequencia(id);
        const contratoId = sequencia.contrato?._id || sequencia.contrato || sequencia.contratoId;
        await this.openSequenciaModal(contratoId, id);
    },

    async saveSequencia() {
        const numero = document.getElementById('input-sequencia-numero').value;
        const dia = document.getElementById('input-sequencia-dia').value;
        const custo = document.getElementById('input-sequencia-custo').value;

        if (!numero || !dia || !custo) {
            Utils.showToast('Preencha todos os campos', 'error');
            return;
        }

        try {
            if (this.currentSequenciaId) {
                await DataManager.updateSequencia(this.currentSequenciaId, {
                    numero: parseInt(numero),
                    diaEmissao: parseInt(dia),
                    custo: parseFloat(custo)
                });
                Utils.showToast('Sequencia atualizada', 'success');
            } else {
                await DataManager.addSequencia(this.currentContratoId, numero, dia, custo);
                Utils.showToast('Sequencia cadastrada', 'success');
            }

            this.closeModal('modal-sequencia');
            await this.renderContratos();
        } catch (error) {
            console.error('Erro ao salvar sequencia:', error);
            Utils.showToast('Erro ao salvar sequencia', 'error');
        }
    },

    async deleteSequencia(id) {
        if (Utils.confirm('Excluir esta sequencia?')) {
            try {
                await DataManager.deleteSequencia(id);
                Utils.showToast('Sequencia excluida', 'success');
                await this.renderContratos();
            } catch (error) {
                console.error('Erro ao excluir sequencia:', error);
                Utils.showToast('Erro ao excluir sequencia', 'error');
            }
        }
    },

    // ==================== RELATORIO MENSAL ====================

    async renderRelatorio() {
        try {
            const [tableData, fornecedores] = await Promise.all([
                DataManager.getTableData(),
                DataManager.getFornecedores()
            ]);
            const months = Utils.getCurrentYearMonths();

            // Preencher filtro de fornecedores
            const filterSelect = document.getElementById('filter-fornecedor');
            filterSelect.innerHTML = '<option value="">Todos os fornecedores</option>' +
                fornecedores.map(f => `<option value="${f._id || f.id}">${f.nome}</option>`).join('');
            filterSelect.value = this.filterFornecedor;

            // Filtrar dados
            let filteredData = tableData;
            if (this.filterFornecedor) {
                filteredData = tableData.filter(row => {
                    const rowFornecedorId = row.fornecedorId?._id || row.fornecedorId;
                    return rowFornecedorId === this.filterFornecedor;
                });
            }

            // Construir tabela
            const thead = document.getElementById('relatorio-thead');
            const tbody = document.getElementById('relatorio-tbody');

            // Header
            thead.innerHTML = `
                <tr>
                    <th class="col-fornecedor">Fornecedor</th>
                    <th class="col-contrato">Contrato</th>
                    <th class="col-estab">Estab.</th>
                    <th class="col-seq">Seq.</th>
                    <th class="col-emissao">Emissao</th>
                    <th class="col-custo">Custo</th>
                    ${months.map(m => `<th class="col-mes">${m.name}</th>`).join('')}
                </tr>
            `;

            // Body
            if (filteredData.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="${6 + months.length}" style="text-align: center; padding: 2rem;">
                            Nenhum dado encontrado
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = filteredData.map(row => {
                const seqId = row.sequenciaId?._id || row.sequenciaId;
                const monthCells = months.map(month => {
                    const savedStatus = row.statusMensal[month.key];
                    const calculatedStatus = Utils.calculateStatus(row.diaEmissao, month.key, savedStatus === 'ok');
                    const status = savedStatus || calculatedStatus;
                    const statusClass = Utils.getStatusClass(status);
                    const statusText = Utils.getStatusText(status);

                    return `
                        <td class="col-mes">
                            <span class="status-cell ${statusClass}"
                                  onclick="App.toggleStatus('${seqId}', '${month.key}')"
                                  title="Clique para alterar">
                                ${statusText}
                            </span>
                        </td>
                    `;
                }).join('');

                return `
                    <tr>
                        <td class="col-fornecedor">${row.fornecedor}</td>
                        <td class="col-contrato">${row.contrato}</td>
                        <td class="col-estab">${row.estabelecimento}</td>
                        <td class="col-seq">${row.sequencia}</td>
                        <td class="col-emissao">Dia ${row.diaEmissao}</td>
                        <td class="col-custo">${Utils.formatCurrency(row.custo)}</td>
                        ${monthCells}
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Erro ao renderizar relatorio:', error);
            Utils.showToast('Erro ao carregar relatorio', 'error');
        }
    },

    async toggleStatus(sequenciaId, monthKey) {
        try {
            const sequencia = await DataManager.getSequencia(sequenciaId);
            const statusMensal = sequencia.statusMensal instanceof Map
                ? Object.fromEntries(sequencia.statusMensal)
                : (sequencia.statusMensal || {});

            const currentStatus = statusMensal[monthKey] ||
                                 Utils.calculateStatus(sequencia.diaEmissao, monthKey);

            // Ciclar entre status: pendente -> ok -> atrasada -> pendente
            const statusOrder = ['pendente', 'ok', 'atrasada', 'atualizar_contrato'];
            const currentIndex = statusOrder.indexOf(currentStatus);
            const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

            await DataManager.updateSequenciaStatus(sequenciaId, monthKey, nextStatus);
            await this.renderRelatorio();
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            Utils.showToast('Erro ao alterar status', 'error');
        }
    },

    async applyFilter() {
        this.filterFornecedor = document.getElementById('filter-fornecedor').value;
        await this.renderRelatorio();
    },

    // ==================== MODAIS ====================

    setupModals() {
        // Fechar modal ao clicar no overlay
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });

        // Fechar modal ao clicar no botao X
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal-overlay').classList.remove('active');
            });
        });

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.active').forEach(m => {
                    m.classList.remove('active');
                });
            }
        });
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    // ==================== FORMULARIOS ====================

    setupForms() {
        // Form fornecedor
        document.getElementById('form-fornecedor').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFornecedor();
        });

        // Form contrato
        document.getElementById('form-contrato').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContrato();
        });

        // Form sequencia
        document.getElementById('form-sequencia').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSequencia();
        });
    },

    // ==================== IMPORT/EXPORT ====================

    async exportData() {
        try {
            const json = await DataManager.exportJSON();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `controle-contratos-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Utils.showToast('Dados exportados', 'success');
        } catch (error) {
            console.error('Erro ao exportar:', error);
            Utils.showToast('Erro ao exportar dados', 'error');
        }
    },

    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const result = await DataManager.importJSON(event.target.result);
                    if (result) {
                        Utils.showToast('Dados importados', 'success');
                        await this.navigateTo(this.currentSection);
                    } else {
                        Utils.showToast('Erro ao importar dados', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    },

    async resetData() {
        if (Utils.confirm('Tem certeza que deseja resetar todos os dados? Esta acao nao pode ser desfeita.')) {
            try {
                DataManager.reset();
                await DataManager.loadSampleData();
                Utils.showToast('Dados resetados', 'success');
                await this.navigateTo('dashboard');
            } catch (error) {
                console.error('Erro ao resetar:', error);
                Utils.showToast('Erro ao resetar dados', 'error');
            }
        }
    }
};

// Inicializar aplicacao quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => App.init());
