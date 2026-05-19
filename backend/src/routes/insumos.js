const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const insumoController = require('../controllers/insumoController');

const router = express.Router();

router.use(requireAuth, requireRole(['admin', 'inventario']));

router.get('/proveedores', asyncHandler(insumoController.listSuppliers));
router.get('/', asyncHandler(insumoController.listInsumos));
router.get('/:id', asyncHandler(insumoController.getInsumo));
router.post('/', asyncHandler(insumoController.createInsumo));
router.put('/:id', asyncHandler(insumoController.updateInsumo));
router.delete('/:id', asyncHandler(insumoController.deleteInsumo));

module.exports = router;
