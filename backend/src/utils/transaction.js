const pool = require('../config/db');
const { resolveDbRole } = require('../config/roles');
const { AppError } = require('./appError');

async function withTransaction(work) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function withRoleTransaction(sessionUser, work) {
  return withTransaction(async (client) => {
    const dbRole = resolveDbRole(sessionUser?.rol);

    if (!dbRole) {
      throw new AppError(403, 'No tienes permisos para acceder con el rol actual.');
    }

    await client.query(`SET LOCAL ROLE ${dbRole}`);
    return work(client);
  });
}

// Activa el rol sin abrir una transacción explícita (usa SET ROLE / RESET ROLE).
// Necesario para invocar stored procedures que ejecutan COMMIT/ROLLBACK con CALL,
// ya que esas sentencias no se permiten dentro de un bloque de transacción abierto.
async function withRoleCall(sessionUser, work) {
  const dbRole = resolveDbRole(sessionUser?.rol);

  if (!dbRole) {
    throw new AppError(403, 'No tienes permisos para acceder con el rol actual.');
  }

  const client = await pool.connect();

  try {
    await client.query(`SET ROLE ${dbRole}`);
    return await work(client);
  } finally {
    try {
      await client.query('RESET ROLE');
      client.release();
    } catch (resetError) {
      // Si falla el RESET, descarta la conexión para no contaminar el pool.
      client.release(resetError);
    }
  }
}

module.exports = {
  withTransaction,
  withRoleTransaction,
  withRoleCall,
};
