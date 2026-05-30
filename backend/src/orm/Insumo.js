const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Insumo = sequelize.define('Insumo', {
  id_insumo:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_proveedor:  { type: DataTypes.INTEGER, allowNull: false },
  nombre:        { type: DataTypes.STRING(150), allowNull: false },
  unidad_medida: { type: DataTypes.STRING(20), allowNull: false },
  stock_actual:  { type: DataTypes.DECIMAL(12, 3), defaultValue: 0 },
  stock_minimo:  { type: DataTypes.DECIMAL(12, 3), defaultValue: 0 },
  costo_unitario:{ type: DataTypes.DECIMAL(10, 4), defaultValue: 0 },
  activo:        { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'insumo',
  timestamps: false,
});

module.exports = Insumo;
