const APP_ROLE_TO_DB_ROLE = Object.freeze({
  admin: 'rol_admin',
  cajero: 'rol_cajero',
  cocinero: 'rol_cocinero',
  inventario: 'rol_inventario',
  analista: 'rol_analista',
});

const ALL_APP_ROLES = Object.freeze(Object.keys(APP_ROLE_TO_DB_ROLE));

function resolveDbRole(appRole) {
  return APP_ROLE_TO_DB_ROLE[appRole] || null;
}

module.exports = {
  ALL_APP_ROLES,
  APP_ROLE_TO_DB_ROLE,
  resolveDbRole,
};
