const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB,
  username: process.env.DB_USER || 'proy3',
  password: process.env.DB_PASSWORD || 'secret',
  logging: false,
});

module.exports = sequelize;
