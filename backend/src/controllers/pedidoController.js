const pool = require('../config/db');
const {
  loadCatalog,
  createOrder,
  getOrderByCode,
  getOrderDetail,
  listCustomers,
  listOrders,
  updateOrderStatus,
} = require('../services/orderService');
const { withRoleTransaction, withTransaction } = require('../utils/transaction');

async function getCatalog(req, res) {
  const client = await pool.connect();

  try {
    const catalog = await loadCatalog(client, { onlyAvailable: true });
    res.json({
      categorias: catalog.categories,
      productos: catalog.products,
    });
  } finally {
    client.release();
  }
}

async function getTrackingByCode(req, res) {
  const client = await pool.connect();

  try {
    const pedido = await getOrderByCode(client, req.params.codigo);
    res.json({ pedido });
  } finally {
    client.release();
  }
}

async function createOnlineOrder(req, res) {
  const pedido = await withTransaction((client) => (
    createOrder(
      client,
      {
        canal: 'online',
        metodo_pago: req.body.metodo_pago,
        customer: req.body.customer,
        notas: req.body.notas,
        items: req.body.items,
      },
      null
    )
  ));

  res.status(201).json({ pedido });
}

async function getCustomers(req, res) {
  const clientes = await withRoleTransaction(req.session.user, (client) => listCustomers(client));
  res.json({ clientes });
}

async function listMonitorOrders(req, res) {
  const pedidos = await withRoleTransaction(req.session.user, (client) => (
    listOrders(client, { limit: req.query.limit })
  ));
  res.json({ pedidos });
}

async function createCounterOrder(req, res) {
  const pedido = await withRoleTransaction(req.session.user, (client) => (
    createOrder(
      client,
      {
        canal: req.body.canal || 'mostrador',
        metodo_pago: req.body.metodo_pago,
        id_cliente: req.body.id_cliente,
        customer: req.body.customer,
        notas: req.body.notas,
        items: req.body.items,
      },
      req.session.user
    )
  ));

  res.status(201).json({ pedido });
}

async function getOrder(req, res) {
  const pedido = await withRoleTransaction(req.session.user, (client) => (
    getOrderDetail(client, Number(req.params.id))
  ));
  res.json({ pedido });
}

async function updateStatus(req, res) {
  const pedido = await withRoleTransaction(req.session.user, (client) => (
    updateOrderStatus(
      client,
      Number(req.params.id),
      req.body.estado,
      req.session.user
    )
  ));

  res.json({ pedido });
}

module.exports = {
  getCatalog,
  getTrackingByCode,
  createOnlineOrder,
  getCustomers,
  listMonitorOrders,
  createCounterOrder,
  getOrder,
  updateStatus,
};
