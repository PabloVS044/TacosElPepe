# Seguridad y roles — Tacos El Pepe

## Roles definidos en PostgreSQL

Se crean exactamente 5 roles de negocio con `CREATE ROLE ... NOLOGIN`. El usuario técnico `proy3` conecta al DBMS y activa el rol correspondiente por request mediante `SET LOCAL ROLE`.

| Rol DB         | Rol de aplicación | Objetivo                         |
|----------------|-------------------|----------------------------------|
| `rol_admin`    | `admin`           | Administración completa          |
| `rol_cajero`   | `cajero`          | Operación de caja y POS          |
| `rol_cocinero` | `cocinero`        | Operación de cocina              |
| `rol_inventario` | `inventario`    | Abastecimiento y stock           |
| `rol_analista` | `analista`        | Lectura ejecutiva (solo consulta)|

---

## Permisos por rol y tabla

| Tabla                      | rol_admin          | rol_cajero               | rol_cocinero | rol_inventario         | rol_analista |
|----------------------------|--------------------|--------------------------|--------------|------------------------|--------------|
| `empleado`                 | SELECT/INSERT/UPDATE/DELETE | SELECT          | SELECT       | SELECT                 | SELECT       |
| `cliente`                  | SELECT/INSERT/UPDATE/DELETE | SELECT/INSERT/UPDATE | SELECT  | —                     | SELECT       |
| `proveedor`                | SELECT/INSERT/UPDATE/DELETE | SELECT          | —            | SELECT                 | SELECT       |
| `insumo`                   | SELECT/INSERT/UPDATE/DELETE | SELECT/UPDATE   | —            | SELECT/INSERT/UPDATE/DELETE | SELECT  |
| `categoria_producto`       | SELECT/INSERT/UPDATE/DELETE | SELECT          | —            | —                      | SELECT       |
| `producto`                 | SELECT/INSERT/UPDATE/DELETE | SELECT          | SELECT       | —                      | SELECT       |
| `receta`                   | SELECT/INSERT/UPDATE/DELETE | SELECT          | —            | —                      | SELECT       |
| `combo_item`               | SELECT/INSERT/UPDATE/DELETE | SELECT          | —            | —                      | SELECT       |
| `extra`                    | SELECT/INSERT/UPDATE/DELETE | SELECT          | SELECT       | —                      | SELECT       |
| `compra_insumo`            | SELECT/INSERT/UPDATE/DELETE | SELECT          | —            | SELECT/INSERT          | SELECT       |
| `compra_insumo_detalle`    | SELECT/INSERT/UPDATE/DELETE | SELECT          | —            | SELECT/INSERT          | SELECT       |
| `pedido`                   | SELECT/INSERT/UPDATE/DELETE | SELECT/INSERT/UPDATE | SELECT/UPDATE | —               | SELECT       |
| `pedido_item`              | SELECT/INSERT/UPDATE/DELETE | SELECT/INSERT   | SELECT       | —                      | SELECT       |
| `pedido_item_modificacion` | SELECT/INSERT/UPDATE/DELETE | SELECT/INSERT   | SELECT       | —                      | SELECT       |
| `pago`                     | SELECT/INSERT/UPDATE/DELETE | SELECT/INSERT/UPDATE | —       | —                      | SELECT       |
| `movimiento_inventario`    | SELECT/INSERT/UPDATE/DELETE | SELECT/INSERT   | —            | SELECT/INSERT          | SELECT       |
| `v_resumen_pedidos` (view) | SELECT             | —                        | SELECT       | —                      | SELECT       |
| `v_stock_critico` (view)   | SELECT             | SELECT                   | —            | SELECT                 | SELECT       |

---

## Rutas del backend protegidas por rol

| Método | Ruta                           | Roles permitidos                        |
|--------|--------------------------------|-----------------------------------------|
| POST   | `/api/auth/login`              | Público                                 |
| POST   | `/api/auth/logout`             | Autenticado                             |
| GET    | `/api/auth/me`                 | Autenticado                             |
| GET    | `/api/productos`               | `admin`                                 |
| POST   | `/api/productos`               | `admin`                                 |
| PUT    | `/api/productos/:id`           | `admin`                                 |
| DELETE | `/api/productos/:id`           | `admin`                                 |
| GET    | `/api/insumos`                 | `admin`, `inventario`                   |
| POST   | `/api/insumos`                 | `admin`, `inventario`                   |
| PUT    | `/api/insumos/:id`             | `admin`, `inventario`                   |
| DELETE | `/api/insumos/:id`             | `admin`, `inventario`                   |
| POST   | `/api/compras-insumos`         | `admin`, `inventario`                   |
| GET    | `/api/pedidos`                 | `admin`, `cajero`, `cocinero`           |
| POST   | `/api/pedidos`                 | `admin`, `cajero`                       |
| GET    | `/api/pedidos/:id`             | `admin`, `cajero`, `cocinero`           |
| PATCH  | `/api/pedidos/:id/estado`      | `admin`, `cajero`, `cocinero`           |
| GET    | `/api/pedidos/clientes`        | `admin`, `cajero`                       |
| GET    | `/api/reportes/*`              | `admin`, `cajero`, `analista`           |
| GET    | `/api/consultas/joins/*`       | `admin`, `cajero`, `analista`           |
| GET    | `/api/consultas/subqueries/*`  | `admin`, `cajero`, `analista`           |
| GET    | `/api/consultas/views/*`       | `admin`, `cajero`, `inventario`, `analista` |

---

## Vistas del frontend protegidas por rol

| Ruta frontend            | admin | cajero | cocinero | inventario | analista |
|--------------------------|-------|--------|----------|------------|----------|
| `/dashboard`             | ✓     | ✓      | —        | —          | ✓        |
| `/pos`                   | ✓     | ✓      | —        | —          | —        |
| `/pedidos`               | ✓     | ✓      | ✓        | —          | —        |
| `/productos`             | ✓     | —      | —        | —          | —        |
| `/insumos`               | ✓     | —      | —        | ✓          | —        |
| `/insumos/reabastecer`   | ✓     | —      | —        | ✓          | —        |
| `/reportes/*`            | ✓     | ✓      | —        | —          | ✓        |
| `/analitica`             | ✓     | ✓      | —        | —          | ✓        |

---

## Stored procedures y permisos de ejecución

| Stored Procedure                  | Descripción                                      | Roles con EXECUTE              |
|-----------------------------------|--------------------------------------------------|--------------------------------|
| `sp_crear_pedido`                 | Inserta pedido + pago + items (IN/OUT + EXCEPTION) | `rol_admin`, `rol_cajero`    |
| `sp_descontar_stock_pedido`       | Descuenta inventario y registra movimientos salida | `rol_admin`, `rol_cajero`   |
| `sp_registrar_compra_insumo`      | Registra compra, actualiza stock (ROLLBACK en EXCEPTION) | `rol_admin`, `rol_inventario` |
| `sp_cancelar_pedido`             | Restaura inventario y cancela pedido             | `rol_admin`, `rol_cajero`      |
| `sp_cambiar_estado_pedido`        | Aplica transición de estado con timestamps        | `rol_admin`, `rol_cajero`, `rol_cocinero` |

---

## Operaciones ORM (Sequelize)

| Operación | Modelo     | Método Sequelize            | Tipo CRUD |
|-----------|------------|-----------------------------|-----------|
| Leer insumo por ID | `Insumo`  | `Insumo.findByPk(id)`      | READ      |
| Crear insumo       | `Insumo`  | `Insumo.create({...})`     | CREATE    |
| Actualizar insumo  | `Insumo`  | `Insumo.update({...}, {where})` | UPDATE |
| Eliminar producto  | `Producto`| `Producto.destroy({where})`| DELETE    |

---

## Credenciales de prueba

| Email                             | Contraseña | Rol de aplicación |
|-----------------------------------|------------|-------------------|
| jose.perez@tacospepe.gt           | admin123   | admin             |
| carlos.hernandez@tacospepe.gt     | admin123   | cajero            |
| roberto.villalobos@tacospepe.gt   | admin123   | cocinero          |
| noemi.soto@tacospepe.gt           | admin123   | inventario        |
| esteban.castro@tacospepe.gt       | admin123   | analista          |
