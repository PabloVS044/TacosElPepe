/**
 * Script para asignar contraseñas reales a los empleados de prueba.
 * Los datos de prueba tienen hashes placeholder que no son válidos.
 *
 * Uso: node scripts/seed-passwords.js
 * Ejecutar una sola vez después de docker compose up.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
});

async function seedPasswords() {
    const password = 'admin123';
    console.log(`Generando hash para contraseña: "${password}" ...`);

    const hash = await bcrypt.hash(password, 10);

    await pool.query('UPDATE empleado SET password_hash = $1', [hash]);

    const result = await pool.query('SELECT COUNT(*) FROM empleado');
    console.log(`Contraseña actualizada para ${result.rows[0].count} empleado(s).`);
    console.log('');
    console.log('Credenciales de prueba:');
    console.log('  Email:      jose.perez@tacospepe.gt  (admin)');
    console.log('  Contraseña: admin123');
    console.log('');
    console.log('Cualquier empleado usa la misma contraseña: admin123');

    await pool.end();
}

seedPasswords().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
