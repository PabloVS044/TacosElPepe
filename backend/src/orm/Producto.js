const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Producto = sequelize.define('Producto', {
  id_producto:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_categoria_producto:{ type: DataTypes.INTEGER, allowNull: false },
  nombre:               { type: DataTypes.STRING(150), allowNull: false },
  descripcion:          { type: DataTypes.TEXT },
  precio:               { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  es_combo:             { type: DataTypes.BOOLEAN, defaultValue: false },
  disponible:           { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'producto',
  timestamps: false,
});

module.exports = Producto;
