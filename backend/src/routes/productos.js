const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

router.get('/categorias', async (req, res) => {
    const result = await pool.query('SELECT id_categoria_producto, nombre FROM categoria_producto ORDER BY nombre');
    res.json({ categorias: result.rows });
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.disponible, p.es_combo,
                   cat.nombre AS categoria
            FROM producto p
            JOIN categoria_producto cat ON cat.id_categoria_producto = p.id_categoria_producto
            ORDER BY cat.nombre, p.nombre
        `);
        res.json({ productos: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener productos.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM producto WHERE id_producto = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
        res.json({ producto: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el producto.' });
    }
});

router.post('/', async (req, res) => {
    const { id_categoria_producto, nombre, descripcion, precio, disponible } = req.body;
    if (!id_categoria_producto || !nombre || precio === undefined) {
        return res.status(400).json({ error: 'Categoría, nombre y precio son obligatorios.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO producto (id_categoria_producto, nombre, descripcion, precio, disponible) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [id_categoria_producto, nombre.trim(), descripcion?.trim() || null, parseFloat(precio), disponible !== false]
        );
        res.status(201).json({ producto: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un producto con ese nombre.' });
        res.status(500).json({ error: 'Error al crear el producto.' });
    }
});

router.put('/:id', async (req, res) => {
    const { id_categoria_producto, nombre, descripcion, precio, disponible } = req.body;
    if (!id_categoria_producto || !nombre || precio === undefined) {
        return res.status(400).json({ error: 'Categoría, nombre y precio son obligatorios.' });
    }
    try {
        const result = await pool.query(
            'UPDATE producto SET id_categoria_producto=$1, nombre=$2, descripcion=$3, precio=$4, disponible=$5 WHERE id_producto=$6 RETURNING *',
            [id_categoria_producto, nombre.trim(), descripcion?.trim() || null, parseFloat(precio), disponible !== false, req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
        res.json({ producto: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un producto con ese nombre.' });
        res.status(500).json({ error: 'Error al actualizar el producto.' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM producto WHERE id_producto=$1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
        res.json({ message: 'Producto eliminado.' });
    } catch (err) {
        if (err.code === '23503') return res.status(409).json({ error: 'No se puede eliminar: el producto tiene pedidos registrados.' });
        res.status(500).json({ error: 'Error al eliminar el producto.' });
    }
});

module.exports = router;
