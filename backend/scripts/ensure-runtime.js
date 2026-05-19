const { DEFAULT_EMPLOYEE_PASSWORD, createReadyClient } = require('./runtime-helpers');

async function main() {
  const client = await createReadyClient();

  try {
    const result = await client.query('SELECT COUNT(*)::int AS total FROM empleado');
    console.log(`Base de datos lista con ${result.rows[0]?.total || 0} empleado(s) semilla.`);
    console.log(`Credenciales del personal listas. Contraseña por defecto: ${DEFAULT_EMPLOYEE_PASSWORD}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Error preparando el runtime:', error.message);
  process.exit(1);
});
