const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const productController = require('../controllers/productController');

const router = express.Router();

router.use(requireAuth, requireRole(['admin']));

router.get('/categorias', asyncHandler(productController.listCategories));
router.get('/', asyncHandler(productController.listProducts));
router.get('/:id', asyncHandler(productController.getProduct));
router.post('/', asyncHandler(productController.createProduct));
router.put('/:id', asyncHandler(productController.updateProduct));
router.delete('/:id', asyncHandler(productController.deleteProduct));

module.exports = router;
