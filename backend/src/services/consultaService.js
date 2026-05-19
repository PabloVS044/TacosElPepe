const consultaModel = require('../models/consultaModel');

module.exports = {
  getJoinPedidosResumen: (executor) => consultaModel.getJoinPedidosResumen(executor),
  getJoinComprasResumen: (executor) => consultaModel.getJoinComprasResumen(executor),
  getSubqueryClientesConPagos: (executor) => consultaModel.getSubqueryClientesConPagos(executor),
  getSubqueryProveedoresGasto: (executor) => consultaModel.getSubqueryProveedoresGasto(executor),
  getSubqueryProductosSinVentas: (executor) => consultaModel.getSubqueryProductosSinVentas(executor),
  getViewPedidosResumen: (executor) => consultaModel.getViewPedidosResumen(executor),
  getViewStockCritico: (executor) => consultaModel.getViewStockCritico(executor),
};
