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

module.exports = {
  withTransaction,
  withRoleTransaction,
};
