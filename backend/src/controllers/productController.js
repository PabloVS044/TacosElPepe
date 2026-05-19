const productService = require('../services/productService');
const { withRoleTransaction } = require('../utils/transaction');

async function listCategories(req, res) {
  const categorias = await withRoleTransaction(req.session.user, (client) => (
    productService.listCategories(client)
  ));
  res.json({ categorias });
}

async function listProducts(req, res) {
  const productos = await withRoleTransaction(req.session.user, (client) => (
    productService.listProducts(client)
  ));
  res.json({ productos });
}

async function getProduct(req, res) {
  const producto = await withRoleTransaction(req.session.user, (client) => (
    productService.getProduct(req.params.id, client)
  ));
  res.json({ producto });
}

async function createProduct(req, res) {
  const producto = await withRoleTransaction(req.session.user, (client) => (
    productService.createProduct(req.body, client)
  ));
  res.status(201).json({ producto });
}

async function updateProduct(req, res) {
  const producto = await withRoleTransaction(req.session.user, (client) => (
    productService.updateProduct(req.params.id, req.body, client)
  ));
  res.json({ producto });
}

async function deleteProduct(req, res) {
  await withRoleTransaction(req.session.user, (client) => (
    productService.deleteProduct(req.params.id, client)
  ));
  res.json({ message: 'Producto eliminado.' });
}

module.exports = {
  listCategories,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
