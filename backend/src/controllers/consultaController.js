const consultaService = require('../services/consultaService');
const { withRoleTransaction } = require('../utils/transaction');

async function getJoinPedidosResumen(req, res) {
  const datos = await withRoleTransaction(req.session.user, (client) => (
    consultaService.getJoinPedidosResumen(client)
  ));
  res.json({ datos });
}

async function getJoinComprasResumen(req, res) {
  const datos = await withRoleTransaction(req.session.user, (client) => (
    consultaService.getJoinComprasResumen(client)
  ));
  res.json({ datos });
}

async function getSubqueryClientesConPagos(req, res) {
  const datos = await withRoleTransaction(req.session.user, (client) => (
    consultaService.getSubqueryClientesConPagos(client)
  ));
  res.json({ datos });
}

async function getSubqueryProveedoresGasto(req, res) {
  const datos = await withRoleTransaction(req.session.user, (client) => (
    consultaService.getSubqueryProveedoresGasto(client)
  ));
  res.json({ datos });
}

async function getSubqueryProductosSinVentas(req, res) {
  const datos = await withRoleTransaction(req.session.user, (client) => (
    consultaService.getSubqueryProductosSinVentas(client)
  ));
  res.json({ datos });
}

async function getViewPedidosResumen(req, res) {
  const datos = await withRoleTransaction(req.session.user, (client) => (
    consultaService.getViewPedidosResumen(client)
  ));
  res.json({ datos });
}

async function getViewStockCritico(req, res) {
  const datos = await withRoleTransaction(req.session.user, (client) => (
    consultaService.getViewStockCritico(client)
  ));
  res.json({ datos });
}

module.exports = {
  getJoinPedidosResumen,
  getJoinComprasResumen,
  getSubqueryClientesConPagos,
  getSubqueryProveedoresGasto,
  getSubqueryProductosSinVentas,
  getViewPedidosResumen,
  getViewStockCritico,
};
