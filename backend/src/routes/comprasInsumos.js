const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const compraInsumoController = require('../controllers/compraInsumoController');

const router = express.Router();

router.use(requireAuth, requireRole(['admin', 'inventario']));
router.post('/', asyncHandler(compraInsumoController.createCompraInsumo));

module.exports = router;
