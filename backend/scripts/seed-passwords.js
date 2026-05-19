const { DEFAULT_EMPLOYEE_PASSWORD, createReadyClient } = require('./runtime-helpers');

async function seedPasswords() {
  const client = await createReadyClient();

  try {
    const result = await client.query(`
      SELECT email, rol
      FROM empleado
      WHERE rol IN ('admin', 'cajero', 'cocinero', 'inventario', 'analista')
      ORDER BY id_empleado
      LIMIT 5
    `);

    console.log('Las contraseñas de prueba ya vienen precargadas desde datos_prueba.sql.');
    console.log('');
    console.log('Credenciales de prueba:');
    result.rows.forEach((row) => {
      console.log(`  ${row.email}  (${row.rol})`);
    });
    console.log(`  Contraseña para todos: ${DEFAULT_EMPLOYEE_PASSWORD}`);
  } finally {
    await client.end();
  }
}

seedPasswords().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
