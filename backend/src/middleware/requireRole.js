const { AppError } = require('../utils/appError');

function requireRole(allowedRoles = []) {
  return function requireRoleMiddleware(req, res, next) {
    const sessionUser = req.session?.user;

    if (!sessionUser) {
      return next(new AppError(401, 'No autenticado'));
    }

    if (!allowedRoles.includes(sessionUser.rol)) {
      return next(new AppError(403, 'No tienes permisos para realizar esta operación.'));
    }

    return next();
  };
}

module.exports = requireRole;
