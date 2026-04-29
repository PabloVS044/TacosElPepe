const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

router.get('/me', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    res.json({ user: req.session.user });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }
    try {
        const result = await pool.query(
            'SELECT id_empleado, nombre, apellido, email, password_hash, rol FROM empleado WHERE email = $1 AND activo = TRUE',
            [email.trim().toLowerCase()]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        }
        const emp = result.rows[0];
        const ok = await bcrypt.compare(password, emp.password_hash);
        if (!ok) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

        req.session.user = {
            id: emp.id_empleado,
            nombre: emp.nombre,
            apellido: emp.apellido,
            email: emp.email,
            rol: emp.rol
        };
        res.json({ user: req.session.user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error del servidor.' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => res.json({ message: 'Sesión cerrada.' }));
});

module.exports = router;
