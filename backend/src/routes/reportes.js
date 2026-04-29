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
            WHERE ped.estado NOT IN ('cancelado')
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

module.exports = router;
