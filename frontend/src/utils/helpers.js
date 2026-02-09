// Formatar valor em Real brasileiro
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Formatar data no padrão brasileiro
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
};

// Parse de valor monetário
export const parseCurrency = (str) => {
  if (typeof str === 'number') return str;
  return parseFloat(str.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
};

// Máscara de moeda
export const maskCurrency = (value) => {
  let v = value.replace(/\D/g, '');
  if (!v) return '';
  v = (parseInt(v, 10) / 100).toFixed(2);
  v = v.replace('.', ',');
  v = v.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return v;
};

// Nomes dos meses
const MONTH_NAMES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const MONTH_FULL_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Obter nome do mês - aceita índice (0-11) ou chave do mês (ex: "2026-01")
export const getMonthName = (monthIndexOrKey) => {
  if (typeof monthIndexOrKey === 'string' && monthIndexOrKey.includes('-')) {
    const [year, month] = monthIndexOrKey.split('-').map(Number);
    return `${MONTH_FULL_NAMES[month - 1]} ${year}`;
  }
  return MONTH_NAMES[monthIndexOrKey];
};

export const getMonthFullName = (monthIndex) => MONTH_FULL_NAMES[monthIndex];

// Gerar chave do mês - sem argumentos retorna o mês atual
export const getMonthKey = (year, month) => {
  if (year === undefined && month === undefined) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
};

// Parse de chave do mês
export const parseMonthKey = (key) => {
  if (!key) return { year: new Date().getFullYear(), month: new Date().getMonth() };
  const [year, month] = key.split('-').map(Number);
  return { year, month: month - 1 };
};

// Calcular status automático
export const calculateStatus = (dia_emissao, monthKey, lancado = false) => {
  if (lancado) return 'ok';

  const today = new Date();
  const { year, month } = parseMonthKey(monthKey);

  if (year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth())) {
    return 'futuro';
  }

  if (year === today.getFullYear() && month === today.getMonth()) {
    return today.getDate() < dia_emissao ? 'pendente' : 'atrasada';
  }

  return 'atrasada';
};

// Texto do status
export const getStatusText = (status) => {
  const texts = {
    'ok': 'OK',
    'pendente': 'PENDENTE',
    'atrasada': 'ATRASADA',
    'atualizar_contrato': 'ATUALIZAR',
    'futuro': '-',
    'registrada': 'REGISTRADA',
    'nao_registrada': 'NÃO REG.',
    'nao_encontrado': 'N/A'
  };
  return texts[status] || status;
};

// Classe CSS do status
export const getStatusClass = (status) => {
  const classes = {
    'ok': 'badge-success',
    'pendente': 'badge-warning',
    'atrasada': 'badge-error',
    'atualizar_contrato': 'badge-warning',
    'futuro': 'badge-ghost',
    'registrada': 'badge-info',
    'nao_registrada': 'badge-secondary',
    'nao_encontrado': 'badge-ghost'
  };
  return classes[status] || 'badge-ghost';
};

// Obter meses do ano atual
export const getCurrentYearMonths = () => {
  const months = [];
  const year = new Date().getFullYear();

  for (let i = 0; i < 12; i++) {
    months.push({
      key: getMonthKey(year, i),
      name: getMonthName(i),
      fullName: getMonthFullName(i),
      year,
      month: i
    });
  }
  return months;
};

// Mapeamento de estabelecimentos
export const ESTABELECIMENTOS = {
  '01': 'PROMA CONTAGEM',
  '02': 'PROMA JUATUBA'
};

export const getEstabelecimentoNome = (codigo) => ESTABELECIMENTOS[codigo] || codigo;
