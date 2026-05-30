const format = require('pg-format');
const compraInsumoModel = require('../models/compraInsumoModel');
const { AppError } = require('../utils/appError');

function parseCompraDetalle(detalle, index) {
  const idInsumo = Number(detalle.id_insumo);
  const cantidad = Number(detalle.cantidad);
  const costoUnitario = Number(detalle.costo_unitario);

  if (!Number.isInteger(idInsumo) || idInsumo <= 0) {
    throw new AppError(400, `El insumo de la línea ${index + 1} es inválido.`);
  }
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new AppError(400, `La cantidad de la línea ${index + 1} debe ser mayor a 0.`);
  }
  if (!Number.isFinite(costoUnitario) || costoUnitario < 0) {
    throw new AppError(400, `El costo unitario de la línea ${index + 1} es inválido.`);
  }

  return {
    id_insumo: idInsumo,
    cantidad,
    costo_unitario: costoUnitario,
  };
}

function parseCompraPayload(payload = {}, sessionUser = null) {
  const idProveedor = Number(payload.id_proveedor);
  const idEmpleado = Number(payload.id_empleado || sessionUser?.id);
  const detalles = Array.isArray(payload.detalles) ? payload.detalles.map(parseCompraDetalle) : [];

  if (!Number.isInteger(idProveedor) || idProveedor <= 0) {
    throw new AppError(400, 'El proveedor es obligatorio.');
  }

  if (!Number.isInteger(idEmpleado) || idEmpleado <= 0) {
    throw new AppError(400, 'No se pudo determinar el empleado que registra la compra.');
  }

  if (detalles.length === 0) {
    throw new AppError(400, 'La compra debe incluir al menos un insumo.');
  }

  const ids = detalles.map((detalle) => detalle.id_insumo);
  if (new Set(ids).size !== ids.length) {
    throw new AppError(400, 'No se puede repetir el mismo insumo dentro de una compra.');
  }

  return {
    id_proveedor: idProveedor,
    id_empleado: idEmpleado,
    observaciones: String(payload.observaciones || '').trim() || null,
    detalles,
  };
}

async function createCompraInsumo(client, payload, sessionUser) {
  const compra = parseCompraPayload(payload, sessionUser);
  const proveedor = await compraInsumoModel.findActiveProviderById(client, compra.id_proveedor);
  if (!proveedor) {
    throw new AppError(404, 'El proveedor indicado no existe o está inactivo.');
  }

  const empleado = await compraInsumoModel.findActiveEmployeeById(client, compra.id_empleado);
  if (!empleado) {
    throw new AppError(404, 'El empleado indicado no existe o está inactivo.');
  }

  const ids = compra.detalles.map((detalle) => detalle.id_insumo);
  const insumos = await compraInsumoModel.findActiveInsumosByIds(client, ids);
  if (insumos.length !== compra.detalles.length) {
    throw new AppError(400, 'Uno o más insumos no existen o están inactivos.');
  }

  const insumosById = new Map(insumos.map((row) => [row.id_insumo, row]));
  compra.detalles.forEach((detalle) => {
    const insumo = insumosById.get(detalle.id_insumo);
    if (insumo.id_proveedor !== compra.id_proveedor) {
      throw new AppError(400, `El insumo "${insumo.nombre}" no pertenece al proveedor seleccionado.`);
    }
  });

  const total = compra.detalles.reduce(
    (sum, detalle) => sum + (detalle.cantidad * detalle.costo_unitario),
    0
  );

  const detalleJson = compra.detalles.map((d) => ({
    id_insumo: d.id_insumo,
    cantidad: d.cantidad,
    costo_unitario: d.costo_unitario,
  }));

  // El stored procedure usa COMMIT/ROLLBACK explícitos, por lo que debe invocarse
  // con el protocolo simple (sin parámetros $1). pg-format escapa los valores de
  // forma segura. El parámetro INOUT devuelve el id de la compra creada.
  const callSql = format(
    'CALL sp_registrar_compra_insumo(%L, %L, %L, %L, %L, NULL)',
    compra.id_proveedor,
    compra.id_empleado,
    total.toFixed(2),
    compra.observaciones,
    JSON.stringify(detalleJson)
  );

  const { rows } = await client.query(callSql);
  const idCompra = rows[0].o_id_compra;

  return {
    compra: {
      id_compra_insumo: idCompra,
      proveedor: proveedor.nombre,
      id_empleado: compra.id_empleado,
      total: total.toFixed(2),
      observaciones: compra.observaciones,
      detalles: compra.detalles,
    },
    message: 'Compra registrada y stock actualizado.',
  };
}

module.exports = {
  createCompraInsumo,
};
