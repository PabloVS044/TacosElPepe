const insumoModel = require('../models/insumoModel');
const Insumo = require('../orm/Insumo');
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

  return { id_proveedor: idProveedor, nombre, unidad_medida: unidadMedida, stock_actual: stockActual, stock_minimo: stockMinimo, costo_unitario: costoUnitario };
}

async function listSuppliers(executor) {
  return insumoModel.listSuppliers(executor);
}

async function listInsumos(executor) {
  return insumoModel.listInsumos(executor);
}

async function getInsumo(idInsumo, executor) {
  const insumo = await Insumo.findByPk(Number(idInsumo), { raw: true });
  if (!insumo) {
    throw new AppError(404, 'Insumo no encontrado.');
  }

  return insumo;
}

async function createInsumo(payload, executor) {
  try {
    const data = parseInsumoPayload(payload);
    const created = await Insumo.create(data);
    return created.get({ plain: true });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError(409, 'Ya existe un insumo con ese nombre.');
    }

    throw error;
  }
}

async function updateInsumo(idInsumo, payload, executor) {
  try {
    const numericId = Number(idInsumo);
    const data = parseInsumoPayload(payload);
    const [count] = await Insumo.update(data, { where: { id_insumo: numericId } });
    if (count === 0) {
      throw new AppError(404, 'Insumo no encontrado.');
    }

    return Insumo.findByPk(numericId, { raw: true });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
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
