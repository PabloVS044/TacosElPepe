export function getRoleHomePath(role) {
  if (role === 'cocinero') return '/pedidos';
  if (role === 'cajero') return '/pos';
  if (role === 'inventario') return '/insumos/reabastecer';
  return '/dashboard';
}
