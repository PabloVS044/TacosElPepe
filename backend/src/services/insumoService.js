const insumoModel = require('../models/insumoModel');
const { AppError } = require('../utils/appError');

function parseInsumoPayload(payload = {}) {
  const idProveedor = Number(payload.id_proveedor);
  const nombre = String(payload.nombre || '').trim();
  const unidadMedida = String(payload.unidad_medida || '').trim();
  const stockActual = Number.parseFloat(payload.stock_actual) || 0;
  const stockMinimo = Number.parseFloat(payload.stock_minimo) || 0;
  const costoUnitario = Number.parseFloat(payload.costo_unitario) || 0;

  if (!Number.isInteger(idProveedor) || idProveedor <= 0 || !nombre || !unidadMedida) {
    throw new AppError(400, 'Proveedor, nombre y unidad de medida son obligatorios.');
  }

  return [idProveedor, nombre, unidadMedida, stockActual, stockMinimo, costoUnitario];
}

async function listSuppliers(executor) {
  return insumoModel.listSuppliers(executor);
}

async function listInsumos(executor) {
  return insumoModel.listInsumos(executor);
}

async function getInsumo(idInsumo, executor) {
  const insumo = await insumoModel.findInsumoById(Number(idInsumo), executor);
  if (!insumo) {
    throw new AppError(404, 'Insumo no encontrado.');
  }

  return insumo;
}

async function createInsumo(payload, executor) {
  try {
    return await insumoModel.createInsumo(parseInsumoPayload(payload), executor);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'Ya existe un insumo con ese nombre.');
    }

    throw error;
  }
}

async function updateInsumo(idInsumo, payload, executor) {
  try {
    const insumo = await insumoModel.updateInsumo(Number(idInsumo), parseInsumoPayload(payload), executor);
    if (!insumo) {
      throw new AppError(404, 'Insumo no encontrado.');
    }

    return insumo;
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'Ya existe un insumo con ese nombre.');
    }

    throw error;
  }
}

async function deleteInsumo(idInsumo, executor) {
  try {
    const deletedRows = await insumoModel.deleteInsumo(Number(idInsumo), executor);
    if (deletedRows === 0) {
      throw new AppError(404, 'Insumo no encontrado.');
    }
  } catch (error) {
    if (error.code === '23503') {
      throw new AppError(409, 'No se puede eliminar: el insumo está en uso en recetas o compras.');
    }

    throw error;
  }
}

module.exports = {
  listSuppliers,
  listInsumos,
  getInsumo,
  createInsumo,
  updateInsumo,
  deleteInsumo,
};
