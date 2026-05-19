-- Ejecutar conectado a la base tacospepe como un usuario con permisos de inspección.
-- Ejemplo:
-- docker compose exec -T db psql -U postgres -d tacospepe < db/consultas/verificacion_roles.sql

SELECT rolname
FROM pg_roles
WHERE rolname IN ('rol_admin', 'rol_cajero', 'rol_cocinero', 'rol_inventario', 'rol_analista')
ORDER BY rolname;

SELECT rolname
FROM pg_roles
WHERE rolname = 'proy3';

SELECT
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE grantee IN ('rol_admin', 'rol_cajero', 'rol_cocinero', 'rol_inventario', 'rol_analista')
ORDER BY grantee, table_name, privilege_type;

BEGIN;
SET LOCAL ROLE rol_analista;
SELECT current_user AS current_role, session_user AS session_role;
SELECT COUNT(*) AS productos_visibles FROM producto;
INSERT INTO producto (id_categoria_producto, nombre, descripcion, precio, es_combo, disponible)
VALUES (1, 'PRUEBA_ANALISTA', 'Debe fallar por permisos', 1.00, FALSE, TRUE);
ROLLBACK;

BEGIN;
SET LOCAL ROLE rol_inventario;
SELECT current_user AS current_role, session_user AS session_role;
SELECT COUNT(*) AS insumos_criticos FROM v_stock_critico;
INSERT INTO compra_insumo (id_proveedor, id_empleado, total, observaciones)
VALUES (1, 29, 0, 'Prueba de permisos con rollback')
RETURNING id_compra_insumo;
ROLLBACK;
