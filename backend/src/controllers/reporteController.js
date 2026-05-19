const reporteService = require('../services/reporteService');
const { withRoleTransaction } = require('../utils/transaction');

async function getVentas(req, res) {
  const datos = await withRoleTransaction(req.session.user, (client) => (
    reporteService.getVentasPorProducto(client)
  ));
  res.json({ datos });
}

async function getDiario(req, res) {
  const datos = await withRoleTransaction(req.session.user, (client) => (
    reporteService.getVentasDiarias(client)
  ));
  res.json({ datos });
}

async function getClientesFrecuentes(req, res) {
  const result = await withRoleTransaction(req.session.user, (client) => (
    reporteService.getClientesFrecuentes(req.query.min_pedidos, client)
  ));
  res.json(result);
}

async function getRankingProductos(req, res) {
  const datos = await withRoleTransaction(req.session.user, (client) => (
    reporteService.getRankingProductos(client)
  ));
  res.json({ datos });
}

module.exports = {
  getVentas,
  getDiario,
  getClientesFrecuentes,
  getRankingProductos,
};
