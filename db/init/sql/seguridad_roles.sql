BEGIN;

DROP USER IF EXISTS proy3;
DROP ROLE IF EXISTS rol_admin;
DROP ROLE IF EXISTS rol_cajero;
DROP ROLE IF EXISTS rol_cocinero;
DROP ROLE IF EXISTS rol_inventario;
DROP ROLE IF EXISTS rol_analista;

CREATE ROLE rol_admin NOLOGIN;
CREATE ROLE rol_cajero NOLOGIN;
CREATE ROLE rol_cocinero NOLOGIN;
CREATE ROLE rol_inventario NOLOGIN;
CREATE ROLE rol_analista NOLOGIN;

CREATE USER proy3
  WITH LOGIN
       PASSWORD 'secret'
       NOINHERIT
       NOSUPERUSER
       NOCREATEDB
       NOCREATEROLE
       NOREPLICATION;

GRANT rol_admin, rol_cajero, rol_cocinero, rol_inventario, rol_analista TO proy3;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO proy3, rol_admin, rol_cajero, rol_cocinero, rol_inventario, rol_analista;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;

GRANT USAGE ON TYPE
  tipo_rol_empleado,
  tipo_canal_pedido,
  tipo_estado_pedido,
  tipo_metodo_pago,
  tipo_estado_pago,
  tipo_movimiento_inv,
  tipo_modificacion
TO proy3, rol_admin, rol_cajero, rol_cocinero, rol_inventario, rol_analista;

GRANT SELECT ON empleado TO proy3;
GRANT SELECT ON
  cliente,
  insumo,
  categoria_producto,
  producto,
  receta,
  combo_item,
  extra,
  pedido,
  pedido_item,
  pedido_item_modificacion,
  pago
TO proy3;
GRANT INSERT, UPDATE ON cliente TO proy3;
GRANT INSERT ON
  pedido,
  pedido_item,
  pedido_item_modificacion,
  pago,
  movimiento_inventario
TO proy3;
GRANT UPDATE ON insumo TO proy3;
GRANT USAGE, SELECT ON SEQUENCE
  cliente_id_cliente_seq,
  pedido_id_pedido_seq,
  pedido_item_id_pedido_item_seq,
  pedido_item_modificacion_id_pedido_item_modificacion_seq,
  pago_id_pago_seq,
  movimiento_inventario_id_movimiento_inventario_seq
TO proy3;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rol_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_admin;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO rol_cajero;
GRANT INSERT, UPDATE ON cliente TO rol_cajero;
GRANT INSERT ON
  pedido,
  pedido_item,
  pedido_item_modificacion,
  pago,
  movimiento_inventario
TO rol_cajero;
GRANT UPDATE ON pedido TO rol_cajero;
GRANT UPDATE ON pago TO rol_cajero;
GRANT UPDATE ON insumo TO rol_cajero;
GRANT USAGE, SELECT ON SEQUENCE
  cliente_id_cliente_seq,
  pedido_id_pedido_seq,
  pedido_item_id_pedido_item_seq,
  pedido_item_modificacion_id_pedido_item_modificacion_seq,
  pago_id_pago_seq,
  movimiento_inventario_id_movimiento_inventario_seq
TO rol_cajero;

GRANT SELECT ON
  cliente,
  empleado,
  pedido,
  pedido_item,
  pedido_item_modificacion,
  pago,
  producto,
  extra,
  v_resumen_pedidos
TO rol_cocinero;
GRANT UPDATE ON pedido TO rol_cocinero;

GRANT SELECT ON
  empleado,
  proveedor,
  insumo,
  compra_insumo,
  compra_insumo_detalle,
  movimiento_inventario,
  v_stock_critico
TO rol_inventario;
GRANT INSERT, UPDATE, DELETE ON insumo TO rol_inventario;
GRANT INSERT ON
  compra_insumo,
  compra_insumo_detalle,
  movimiento_inventario
TO rol_inventario;
GRANT USAGE, SELECT ON SEQUENCE
  insumo_id_insumo_seq,
  compra_insumo_id_compra_insumo_seq,
  movimiento_inventario_id_movimiento_inventario_seq
TO rol_inventario;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO rol_analista;

-- Permisos directos a proy3 para operaciones ORM (Sequelize conecta como proy3 sin SET LOCAL ROLE)
GRANT INSERT, UPDATE, DELETE ON producto TO proy3;
GRANT USAGE, SELECT ON SEQUENCE producto_id_producto_seq TO proy3;
GRANT INSERT ON insumo TO proy3;
GRANT USAGE, SELECT ON SEQUENCE insumo_id_insumo_seq TO proy3;

-- Permisos de ejecución sobre stored procedures
GRANT EXECUTE ON FUNCTION sp_crear_pedido(INT, INT, tipo_canal_pedido, tipo_estado_pedido, NUMERIC, NUMERIC, TEXT, TIMESTAMPTZ, tipo_metodo_pago, tipo_estado_pago, TIMESTAMPTZ, JSONB) TO rol_admin, rol_cajero;
GRANT EXECUTE ON FUNCTION sp_descontar_stock_pedido(INT, INT, JSONB) TO rol_admin, rol_cajero;
GRANT EXECUTE ON PROCEDURE sp_registrar_compra_insumo(INT, INT, NUMERIC, TEXT, JSONB, INT) TO rol_admin, rol_inventario;
GRANT EXECUTE ON FUNCTION sp_cancelar_pedido(INT, INT) TO rol_admin, rol_cajero;
GRANT EXECUTE ON FUNCTION sp_cambiar_estado_pedido(INT, tipo_estado_pedido, INT) TO rol_admin, rol_cajero, rol_cocinero;

COMMIT;
