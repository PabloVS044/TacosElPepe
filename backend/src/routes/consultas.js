const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const consultaController = require('../controllers/consultaController');

const router = express.Router();

router.use(requireAuth);

router.get('/joins/pedidos-resumen', requireRole(['admin', 'cajero', 'analista']), asyncHandler(consultaController.getJoinPedidosResumen));
router.get('/joins/compras-resumen', requireRole(['admin', 'cajero', 'analista']), asyncHandler(consultaController.getJoinComprasResumen));
router.get('/subqueries/clientes-con-pagos', requireRole(['admin', 'cajero', 'analista']), asyncHandler(consultaController.getSubqueryClientesConPagos));
router.get('/subqueries/proveedores-gasto', requireRole(['admin', 'cajero', 'analista']), asyncHandler(consultaController.getSubqueryProveedoresGasto));
router.get('/subqueries/productos-sin-ventas', requireRole(['admin', 'cajero', 'analista']), asyncHandler(consultaController.getSubqueryProductosSinVentas));
router.get('/views/pedidos-resumen', requireRole(['admin', 'cajero', 'analista']), asyncHandler(consultaController.getViewPedidosResumen));
router.get('/views/stock-critico', requireRole(['admin', 'cajero', 'inventario', 'analista']), asyncHandler(consultaController.getViewStockCritico));

module.exports = router;
