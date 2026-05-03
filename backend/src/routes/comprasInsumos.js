const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

router.post('/', async (req, res) => {
    const { id_proveedor, id_empleado, observaciones, detalles } = req.body;
    const empleadoId = Number(id_empleado || req.session.user?.id);

    if (!Number.isInteger(Number(id_proveedor)) || Number(id_proveedor) <= 0) {
        return res.status(400).json({ error: 'El proveedor es obligatorio.' });
    }

    if (!Number.isInteger(empleadoId) || empleadoId <= 0) {
        return res.status(400).json({ error: 'No se pudo determinar el empleado que registra la compra.' });
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ error: 'La compra debe incluir al menos un insumo.' });
    }

    let parsedDetails;
    try {
        parsedDetails = detalles.map((detalle, index) => {
            const idInsumo = Number(detalle.id_insumo);
            const cantidad = Number(detalle.cantidad);
            const costoUnitario = Number(detalle.costo_unitario);

            if (!Number.isInteger(idInsumo) || idInsumo <= 0) {
                throw httpError(400, `El insumo de la línea ${index + 1} es inválido.`);
            }
            if (!Number.isFinite(cantidad) || cantidad <= 0) {
                throw httpError(400, `La cantidad de la línea ${index + 1} debe ser mayor a 0.`);
            }
            if (!Number.isFinite(costoUnitario) || costoUnitario < 0) {
                throw httpError(400, `El costo unitario de la línea ${index + 1} es inválido.`);
            }

            return {
                id_insumo: idInsumo,
                cantidad,
                costo_unitario: costoUnitario,
            };
        });
    } catch (err) {
        return res.status(err.status || 400).json({ error: err.message });
    }

    const ids = parsedDetails.map((detalle) => detalle.id_insumo);
    if (new Set(ids).size !== ids.length) {
        return res.status(400).json({ error: 'No se puede repetir el mismo insumo dentro de una compra.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const proveedorResult = await client.query(
            'SELECT id_proveedor, nombre FROM proveedor WHERE id_proveedor = $1 AND activo = TRUE',
            [Number(id_proveedor)]
        );
        if (proveedorResult.rowCount === 0) {
            throw httpError(404, 'El proveedor indicado no existe o está inactivo.');
        }

        const empleadoResult = await client.query(
            'SELECT id_empleado FROM empleado WHERE id_empleado = $1 AND activo = TRUE',
            [empleadoId]
        );
        if (empleadoResult.rowCount === 0) {
            throw httpError(404, 'El empleado indicado no existe o está inactivo.');
        }

        const insumosResult = await client.query(
            'SELECT id_insumo, id_proveedor, nombre FROM insumo WHERE id_insumo = ANY($1::int[]) AND activo = TRUE',
            [ids]
        );
        if (insumosResult.rowCount !== parsedDetails.length) {
            throw httpError(400, 'Uno o más insumos no existen o están inactivos.');
        }

        const insumosById = new Map(
            insumosResult.rows.map((row) => [row.id_insumo, row])
        );

        for (const detalle of parsedDetails) {
            const insumo = insumosById.get(detalle.id_insumo);
            if (insumo.id_proveedor !== Number(id_proveedor)) {
                throw httpError(
                    400,
                    `El insumo "${insumo.nombre}" no pertenece al proveedor seleccionado.`
                );
            }
        }

        const total = parsedDetails.reduce(
            (sum, detalle) => sum + (detalle.cantidad * detalle.costo_unitario),
            0
        );

        const compraResult = await client.query(
            `INSERT INTO compra_insumo (id_proveedor, id_empleado, fecha, total, observaciones)
             VALUES ($1, $2, NOW(), $3, $4)
             RETURNING id_compra_insumo, fecha, total, observaciones`,
            [Number(id_proveedor), empleadoId, total.toFixed(2), observaciones?.trim() || null]
        );

        const compra = compraResult.rows[0];

        for (const detalle of parsedDetails) {
            await client.query(
                `INSERT INTO compra_insumo_detalle
                    (id_compra_insumo, id_insumo, cantidad, costo_unitario)
                 VALUES ($1, $2, $3, $4)`,
                [compra.id_compra_insumo, detalle.id_insumo, detalle.cantidad, detalle.costo_unitario]
            );

            await client.query(
                `UPDATE insumo
                 SET stock_actual = stock_actual + $1
                 WHERE id_insumo = $2`,
                [detalle.cantidad, detalle.id_insumo]
            );

            await client.query(
                `INSERT INTO movimiento_inventario
                    (id_insumo, id_empleado, id_compra_insumo, tipo, cantidad, motivo, fecha)
                 VALUES ($1, $2, $3, 'entrada', $4, $5, NOW())`,
                [
                    detalle.id_insumo,
                    empleadoId,
                    compra.id_compra_insumo,
                    detalle.cantidad,
                    `Compra de insumo #${compra.id_compra_insumo}`,
                ]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            compra: {
                ...compra,
                proveedor: proveedorResult.rows[0].nombre,
                id_empleado: empleadoId,
                detalles: parsedDetails,
            },
            message: 'Compra registrada y stock actualizado.',
        });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(err.status || 500).json({
            error: err.message || 'No se pudo registrar la compra.',
        });
    } finally {
        client.release();
    }
});

module.exports = router;
