const { isAppError } = require('../utils/appError');

function notFound(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === '42501') {
    return res.status(403).json({ error: 'La base de datos rechazó la operación para este rol.' });
  }

  if (isAppError(error) || error.status) {
    return res.status(error.status || 500).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: 'Error interno del servidor.' });
}

module.exports = {
  notFound,
  errorHandler,
};
