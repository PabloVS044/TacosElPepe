const reporteModel = require('../models/reporteModel');
const { AppError } = require('../utils/appError');

async function getVentasPorProducto(executor) {
  return reporteModel.getVentasPorProducto(executor);
}

async function getVentasDiarias(executor) {
  return reporteModel.getVentasDiarias(executor);
}

async function getClientesFrecuentes(minPedidos, executor) {
  const parsedMinPedidos = Number(minPedidos || 2);
  if (!Number.isInteger(parsedMinPedidos) || parsedMinPedidos < 1) {
    throw new AppError(400, 'min_pedidos debe ser un entero mayor o igual a 1.');
  }

  const datos = await reporteModel.getClientesFrecuentes(parsedMinPedidos, executor);
  return {
    datos,
    min_pedidos: parsedMinPedidos,
  };
}

async function getRankingProductos(executor) {
  return reporteModel.getRankingProductos(executor);
}

module.exports = {
  getVentasPorProducto,
  getVentasDiarias,
  getClientesFrecuentes,
  getRankingProductos,
};
