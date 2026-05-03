const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

router.get('/joins/pedidos-resumen', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.id_pedido,
                p.fecha_creacion AS fecha,
                c.nombre || ' ' || c.apellido AS cliente,
                COALESCE(e.nombre || ' ' || e.apellido, 'Sin asignar') AS cajero,
                p.canal,
                p.estado AS estado_pedido,
                p.total,
                pg.metodo AS metodo_pago,
                pg.estado AS estado_pago
            FROM pedido p
            JOIN cliente c ON c.id_cliente = p.id_cliente
            LEFT JOIN empleado e ON e.id_empleado = p.id_cajero
            LEFT JOIN pago pg ON pg.id_pedido = p.id_pedido
            ORDER BY p.fecha_creacion DESC
        `);
        res.json({ datos: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el resumen de pedidos.' });
    }
});

router.get('/joins/compras-resumen', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ci.id_compra_insumo,
                ci.fecha,
                prov.nombre AS proveedor,
                emp.nombre || ' ' || emp.apellido AS empleado,
                COUNT(cid.id_insumo) AS lineas_detalle,
                SUM(cid.cantidad * cid.costo_unitario) AS total_calculado,
                ci.total AS total_registrado
            FROM compra_insumo ci
            JOIN proveedor prov ON prov.id_proveedor = ci.id_proveedor
            JOIN empleado emp ON emp.id_empleado = ci.id_empleado
            JOIN compra_insumo_detalle cid ON cid.id_compra_insumo = ci.id_compra_insumo
            GROUP BY ci.id_compra_insumo, ci.fecha, prov.nombre, emp.id_empleado, emp.nombre, emp.apellido, ci.total
            ORDER BY ci.fecha DESC
        `);
        res.json({ datos: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el resumen de compras.' });
    }
});

router.get('/subqueries/clientes-con-pagos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                c.id_cliente,
                c.nombre || ' ' || c.apellido AS cliente,
                c.email,
                c.telefono
            FROM cliente c
            WHERE EXISTS (
                SELECT 1
                FROM pedido p
                JOIN pago pg ON pg.id_pedido = p.id_pedido
                WHERE p.id_cliente = c.id_cliente
                  AND pg.estado = 'pagado'
            )
            ORDER BY c.nombre, c.apellido
        `);
        res.json({ datos: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener clientes con pagos.' });
    }
});

router.get('/subqueries/proveedores-gasto', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                prov.id_proveedor,
                prov.nombre AS proveedor,
                prov.contacto_nombre AS contacto,
                prov.email,
                resumen.num_compras,
                resumen.gasto_total
            FROM proveedor prov
            JOIN (
                SELECT
                    id_proveedor,
                    COUNT(*) AS num_compras,
                    SUM(total) AS gasto_total
                FROM compra_insumo
                GROUP BY id_proveedor
            ) AS resumen ON resumen.id_proveedor = prov.id_proveedor
            ORDER BY resumen.gasto_total DESC, prov.nombre
        `);
        res.json({ datos: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener gasto por proveedor.' });
    }
});

router.get('/subqueries/productos-sin-ventas', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                pr.id_producto,
                cat.nombre AS categoria,
                pr.nombre AS producto,
                pr.precio,
                pr.disponible
            FROM producto pr
            JOIN categoria_producto cat ON cat.id_categoria_producto = pr.id_categoria_producto
            WHERE NOT EXISTS (
                SELECT 1
                FROM pedido_item pi
                WHERE pi.id_producto = pr.id_producto
            )
            ORDER BY cat.nombre, pr.nombre
        `);
        res.json({ datos: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener productos sin ventas.' });
    }
});

router.get('/views/pedidos-resumen', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM v_resumen_pedidos
            ORDER BY fecha_creacion DESC
            LIMIT 50
        `);
        res.json({ datos: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener datos desde la vista de pedidos.' });
    }
});

router.get('/views/stock-critico', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM v_stock_critico
            ORDER BY deficit DESC, insumo
        `);
        res.json({ datos: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener datos desde la vista de stock crítico.' });
    }
});

module.exports = router;
