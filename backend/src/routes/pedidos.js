const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const pedidoController = require('../controllers/pedidoController');

const router = express.Router();

router.get('/catalogo', asyncHandler(pedidoController.getCatalog));
router.get('/seguimiento/:codigo', asyncHandler(pedidoController.getTrackingByCode));
router.post('/online', asyncHandler(pedidoController.createOnlineOrder));

router.use(requireAuth);

router.get('/clientes', requireRole(['admin', 'cajero']), asyncHandler(pedidoController.getCustomers));
router.get('/', requireRole(['admin', 'cajero', 'cocinero']), asyncHandler(pedidoController.listMonitorOrders));
router.post('/', requireRole(['admin', 'cajero']), asyncHandler(pedidoController.createCounterOrder));
router.get('/:id', requireRole(['admin', 'cajero', 'cocinero']), asyncHandler(pedidoController.getOrder));
router.patch('/:id/estado', requireRole(['admin', 'cajero', 'cocinero']), asyncHandler(pedidoController.updateStatus));

module.exports = router;
