const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const reporteController = require('../controllers/reporteController');

const router = express.Router();

router.use(requireAuth, requireRole(['admin', 'cajero', 'analista']));

router.get('/ventas', asyncHandler(reporteController.getVentas));
router.get('/diario', asyncHandler(reporteController.getDiario));
router.get('/clientes-frecuentes', asyncHandler(reporteController.getClientesFrecuentes));
router.get('/ranking-productos', asyncHandler(reporteController.getRankingProductos));

module.exports = router;
