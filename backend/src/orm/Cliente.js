const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Cliente = sequelize.define('Cliente', {
  id_cliente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:     { type: DataTypes.STRING(100), allowNull: false },
  apellido:   { type: DataTypes.STRING(100), allowNull: false },
  email:      { type: DataTypes.STRING(150), allowNull: false },
  telefono:   { type: DataTypes.STRING(20) },
  direccion:  { type: DataTypes.STRING(255) },
  activo:     { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'cliente',
  timestamps: false,
});

module.exports = Cliente;
