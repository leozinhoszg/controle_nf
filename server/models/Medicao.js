const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Medicao = sequelize.define('Medicao', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    sequencia_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    num_seq_medicao: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cod_estabel: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    serie_nota: {
        type: DataTypes.STRING(50),
        defaultValue: ''
    },
    sld_val_medicao: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        get() {
            const val = this.getDataValue('sld_val_medicao');
            return val !== null ? parseFloat(val) : 0;
        }
    },
    num_seq_item: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    numero_ordem: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    val_medicao: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
            const val = this.getDataValue('val_medicao');
            return val !== null ? parseFloat(val) : null;
        }
    },
    dat_medicao: {
        type: DataTypes.DATE,
        allowNull: false
    },
    sld_rec_medicao: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        get() {
            const val = this.getDataValue('sld_rec_medicao');
            return val !== null ? parseFloat(val) : 0;
        }
    },
    nr_contrato: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    dat_prev_medicao: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    numero_nota: {
        type: DataTypes.STRING(50),
        defaultValue: ''
    },
    nome_emit: {
        type: DataTypes.STRING(255),
        defaultValue: ''
    },
    dat_receb: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    responsavel: {
        type: DataTypes.STRING(255),
        defaultValue: ''
    },
    mes_referencia: {
        type: DataTypes.STRING(7),
        allowNull: false
    },
    status_registro: {
        type: DataTypes.ENUM('registrada', 'nao_registrada', 'pendente'),
        allowNull: false,
        defaultValue: 'pendente'
    },
    alerta_valor: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    diferenca_valor: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        get() {
            const val = this.getDataValue('diferenca_valor');
            return val !== null ? parseFloat(val) : 0;
        }
    },
    sincronizado_em: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'medicoes',
    indexes: [
        { unique: true, fields: ['nr_contrato', 'cod_estabel', 'num_seq_item', 'num_seq_medicao'] },
        { fields: ['sequencia_id', 'mes_referencia'] }
    ]
});

module.exports = Medicao;
