// Utilitários do Sistema de Controle de Contratos

const Utils = {
    // Gerar ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Formatar valor em Real brasileiro
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    // Parse de valor monetário string para número
    parseCurrency(str) {
        if (typeof str === 'number') return str;
        return parseFloat(str.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    },

    // Formatar dia de emissão
    formatDiaEmissao(dia) {
        return `Dia ${dia}`;
    },

    // Obter nome do mês
    getMonthName(monthIndex) {
        const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        return months[monthIndex];
    },

    // Obter nome completo do mês
    getMonthFullName(monthIndex) {
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return months[monthIndex];
    },

    // Gerar chave do mês (ex: "2025-01")
    getMonthKey(year, month) {
        return `${year}-${String(month + 1).padStart(2, '0')}`;
    },

    // Parse de chave do mês
    parseMonthKey(key) {
        const [year, month] = key.split('-').map(Number);
        return { year, month: month - 1 };
    },

    // Calcular status automático baseado na data
    calculateStatus(diaEmissao, monthKey, lancado = false) {
        if (lancado) return 'ok';

        const today = new Date();
        const { year, month } = this.parseMonthKey(monthKey);
        const emissaoDate = new Date(year, month, diaEmissao);

        // Se o mês é futuro, não tem status ainda
        if (year > today.getFullYear() ||
            (year === today.getFullYear() && month > today.getMonth())) {
            return 'futuro';
        }

        // Se é o mês atual
        if (year === today.getFullYear() && month === today.getMonth()) {
            if (today.getDate() < diaEmissao) {
                return 'pendente'; // Ainda não chegou a data
            } else {
                return 'atrasada'; // Passou a data sem lançar
            }
        }

        // Mês passado sem lançamento
        return 'atrasada';
    },

    // Obter classe CSS para status
    getStatusClass(status) {
        const classes = {
            'ok': 'status-ok',
            'pendente': 'status-pendente',
            'atrasada': 'status-atrasada',
            'atualizar_contrato': 'status-atualizar',
            'futuro': 'status-futuro'
        };
        return classes[status] || '';
    },

    // Obter texto para status
    getStatusText(status) {
        const texts = {
            'ok': 'OK',
            'pendente': 'Pendente',
            'atrasada': 'Atrasada',
            'atualizar_contrato': 'Atualizar Contrato',
            'futuro': '-'
        };
        return texts[status] || status;
    },

    // Obter array de meses para exibição (12 meses a partir do atual)
    getDisplayMonths(startFromCurrent = true) {
        const months = [];
        const today = new Date();
        const startMonth = startFromCurrent ? today.getMonth() : 0;
        const startYear = today.getFullYear();

        for (let i = 0; i < 12; i++) {
            const month = (startMonth + i) % 12;
            const year = startYear + Math.floor((startMonth + i) / 12);
            months.push({
                key: this.getMonthKey(year, month),
                name: this.getMonthName(month),
                fullName: this.getMonthFullName(month),
                year: year,
                month: month
            });
        }
        return months;
    },

    // Obter meses do ano atual
    getCurrentYearMonths() {
        const months = [];
        const year = new Date().getFullYear();

        for (let i = 0; i < 12; i++) {
            months.push({
                key: this.getMonthKey(year, i),
                name: this.getMonthName(i),
                fullName: this.getMonthFullName(i),
                year: year,
                month: i
            });
        }
        return months;
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Mostrar notificação toast
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Confirmar ação
    confirm(message) {
        return window.confirm(message);
    }
};

// Export para uso global
window.Utils = Utils;
