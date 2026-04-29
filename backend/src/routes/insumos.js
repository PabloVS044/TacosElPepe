const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

router.get('/proveedores', async (req, res) => {
    const result = await pool.query('SELECT id_proveedor, nombre FROM proveedor WHERE activo=TRUE ORDER BY nombre');
    res.json({ proveedores: result.rows });
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.id_insumo, i.nombre, i.unidad_medida, i.stock_actual,
                   i.stock_minimo, i.costo_unitario, i.activo,
                   p.nombre AS proveedor
            FROM insumo i
            JOIN proveedor p ON p.id_proveedor = i.id_proveedor
            ORDER BY i.nombre
        `);
        res.json({ insumos: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener insumos.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM insumo WHERE id_insumo=$1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Insumo no encontrado.' });
        res.json({ insumo: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el insumo.' });
    }
});

router.post('/', async (req, res) => {
    const { id_proveedor, nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario } = req.body;
    if (!id_proveedor || !nombre || !unidad_medida) {
        return res.status(400).json({ error: 'Proveedor, nombre y unidad de medida son obligatorios.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO insumo (id_proveedor, nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [id_proveedor, nombre.trim(), unidad_medida, parseFloat(stock_actual)||0, parseFloat(stock_minimo)||0, parseFloat(costo_unitario)||0]
        );
        res.status(201).json({ insumo: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un insumo con ese nombre.' });
        res.status(500).json({ error: 'Error al crear el insumo.' });
    }
});

router.put('/:id', async (req, res) => {
    const { id_proveedor, nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario } = req.body;
    if (!id_proveedor || !nombre || !unidad_medida) {
        return res.status(400).json({ error: 'Proveedor, nombre y unidad de medida son obligatorios.' });
    }
    try {
        const result = await pool.query(
            'UPDATE insumo SET id_proveedor=$1, nombre=$2, unidad_medida=$3, stock_actual=$4, stock_minimo=$5, costo_unitario=$6 WHERE id_insumo=$7 RETURNING *',
            [id_proveedor, nombre.trim(), unidad_medida, parseFloat(stock_actual)||0, parseFloat(stock_minimo)||0, parseFloat(costo_unitario)||0, req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Insumo no encontrado.' });
        res.json({ insumo: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un insumo con ese nombre.' });
        res.status(500).json({ error: 'Error al actualizar el insumo.' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM insumo WHERE id_insumo=$1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Insumo no encontrado.' });
        res.json({ message: 'Insumo eliminado.' });
    } catch (err) {
        if (err.code === '23503') return res.status(409).json({ error: 'No se puede eliminar: el insumo está en uso en recetas o compras.' });
        res.status(500).json({ error: 'Error al eliminar el insumo.' });
    }
});

module.exports = router;
