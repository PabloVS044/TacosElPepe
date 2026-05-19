const insumoService = require('../services/insumoService');
const { withRoleTransaction } = require('../utils/transaction');

async function listSuppliers(req, res) {
  const proveedores = await withRoleTransaction(req.session.user, (client) => (
    insumoService.listSuppliers(client)
  ));
  res.json({ proveedores });
}

async function listInsumos(req, res) {
  const insumos = await withRoleTransaction(req.session.user, (client) => (
    insumoService.listInsumos(client)
  ));
  res.json({ insumos });
}

async function getInsumo(req, res) {
  const insumo = await withRoleTransaction(req.session.user, (client) => (
    insumoService.getInsumo(req.params.id, client)
  ));
  res.json({ insumo });
}

async function createInsumo(req, res) {
  const insumo = await withRoleTransaction(req.session.user, (client) => (
    insumoService.createInsumo(req.body, client)
  ));
  res.status(201).json({ insumo });
}

async function updateInsumo(req, res) {
  const insumo = await withRoleTransaction(req.session.user, (client) => (
    insumoService.updateInsumo(req.params.id, req.body, client)
  ));
  res.json({ insumo });
}

async function deleteInsumo(req, res) {
  await withRoleTransaction(req.session.user, (client) => (
    insumoService.deleteInsumo(req.params.id, client)
  ));
  res.json({ message: 'Insumo eliminado.' });
}

module.exports = {
  listSuppliers,
  listInsumos,
  getInsumo,
  createInsumo,
  updateInsumo,
  deleteInsumo,
};
