const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

router.get('/ventas', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT cat.nombre AS categoria, pr.nombre AS producto,
                   pr.precio AS precio_unitario,
                   SUM(pi.cantidad) AS unidades_vendidas,
                   SUM(pi.subtotal_linea) AS ingresos_totales
            FROM pedido_item pi
            JOIN pedido ped ON ped.id_pedido = pi.id_pedido
            JOIN producto pr ON pr.id_producto = pi.id_producto
            JOIN categoria_producto cat ON cat.id_categoria_producto = pr.id_categoria_producto
            WHERE ped.estado IN ('finalizado', 'entregado')
            GROUP BY cat.nombre, pr.id_producto, pr.nombre, pr.precio
            ORDER BY ingresos_totales DESC
        `);
        res.json({ datos: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al generar el reporte.' });
    }
});

router.get('/diario', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DATE(p.fecha_creacion AT TIME ZONE 'America/Guatemala') AS fecha,
                   COUNT(p.id_pedido) AS num_pedidos,
                   SUM(p.total) AS total_ventas,
                   SUM(CASE WHEN p.canal = 'online' THEN 1 ELSE 0 END) AS pedidos_online,
                   SUM(CASE WHEN p.canal = 'mostrador' THEN 1 ELSE 0 END) AS pedidos_mostrador,
                   ROUND(AVG(p.total), 2) AS ticket_promedio
            FROM pedido p
            WHERE p.estado IN ('finalizado', 'entregado')
            GROUP BY DATE(p.fecha_creacion AT TIME ZONE 'America/Guatemala')
            ORDER BY fecha DESC
            LIMIT 30
        `);
        res.json({ datos: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al generar el reporte.' });
    }
});

router.get('/clientes-frecuentes', async (req, res) => {
    try {
        const minPedidos = Number(req.query.min_pedidos || 2);
        if (!Number.isInteger(minPedidos) || minPedidos < 1) {
            return res.status(400).json({ error: 'min_pedidos debe ser un entero mayor o igual a 1.' });
        }
        const result = await pool.query(`
            SELECT
                c.id_cliente,
                c.nombre || ' ' || c.apellido AS cliente,
                c.email,
                COUNT(p.id_pedido) AS total_pedidos,
                SUM(p.total) AS gasto_total,
                ROUND(AVG(p.total), 2) AS gasto_promedio
            FROM cliente c
            JOIN pedido p ON p.id_cliente = c.id_cliente
            JOIN pago pg ON pg.id_pedido = p.id_pedido
            WHERE pg.estado = 'pagado'
              AND p.estado IN ('finalizado', 'entregado')
            GROUP BY c.id_cliente, c.nombre, c.apellido, c.email
            HAVING COUNT(p.id_pedido) >= $1
            ORDER BY total_pedidos DESC, gasto_total DESC
        `, [minPedidos]);
        res.json({ datos: result.rows, min_pedidos: minPedidos });
    } catch (err) {
        res.status(500).json({ error: 'Error al generar el reporte de clientes frecuentes.' });
    }
});

router.get('/ranking-productos', async (req, res) => {
    try {
        const result = await pool.query(`
            WITH ventas_producto AS (
                SELECT
                    pi.id_producto,
                    SUM(pi.cantidad) AS unidades_vendidas,
                    SUM(pi.subtotal_linea) AS ingresos
                FROM pedido_item pi
                JOIN pedido p ON p.id_pedido = pi.id_pedido
                WHERE p.estado IN ('finalizado', 'entregado')
                GROUP BY pi.id_producto
            ),
            total_ingresos AS (
                SELECT SUM(ingresos) AS total FROM ventas_producto
            )
            SELECT
                RANK() OVER (ORDER BY vp.ingresos DESC) AS ranking,
                pr.id_producto,
                pr.nombre AS producto,
                cat.nombre AS categoria,
                vp.unidades_vendidas,
                vp.ingresos,
                ROUND((vp.ingresos / NULLIF(ti.total, 0)) * 100, 2) AS pct_del_total
            FROM ventas_producto vp
            JOIN producto pr ON pr.id_producto = vp.id_producto
            JOIN categoria_producto cat ON cat.id_categoria_producto = pr.id_categoria_producto
            CROSS JOIN total_ingresos ti
            ORDER BY ranking, pr.nombre
        `);
        res.json({ datos: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al generar el ranking de productos.' });
    }
});

module.exports = router;
