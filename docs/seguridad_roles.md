# Seguridad y Roles

Implementación de la Parte I del Proyecto 3: seguridad en PostgreSQL con roles reales del DBMS, autenticación con sesión y protección de rutas/vistas por rol.

## Mapeo de roles

| Rol app | Rol PostgreSQL | Home UI | Superficie principal |
|---|---|---|---|
| `admin` | `rol_admin` | `/dashboard` | Backoffice completo |
| `cajero` | `rol_cajero` | `/pos` | POS, pedidos, reportes y analítica |
| `cocinero` | `rol_cocinero` | `/pedidos` | Monitor de pedidos y cambios de estado de cocina |
| `inventario` | `rol_inventario` | `/insumos/reabastecer` | Insumos y compras de abastecimiento |
| `analista` | `rol_analista` | `/dashboard` | Dashboard, reportes y analítica de solo lectura |

El backend se conecta con el usuario técnico `proy3` y, en cada request autenticado, ejecuta `SET LOCAL ROLE` según el rol del empleado en sesión.
Los 5 roles de negocio se crean explícitamente con `CREATE ROLE`; `proy3` se crea aparte como usuario técnico de conexión y no forma parte de esos 5 roles de negocio.

## Rutas protegidas

| Endpoint | Roles permitidos |
|---|---|
| `/api/productos/*` | `admin` |
| `/api/insumos/*` | `admin`, `inventario` |
| `/api/compras-insumos` | `admin`, `inventario` |
| `/api/reportes/*` | `admin`, `cajero`, `analista` |
| `/api/consultas/joins/*` | `admin`, `cajero`, `analista` |
| `/api/consultas/subqueries/*` | `admin`, `cajero`, `analista` |
| `/api/consultas/views/pedidos-resumen` | `admin`, `cajero`, `analista` |
| `/api/consultas/views/stock-critico` | `admin`, `cajero`, `inventario`, `analista` |
| `GET /api/pedidos`, `GET /api/pedidos/:id` | `admin`, `cajero`, `cocinero` |
| `GET /api/pedidos/clientes`, `POST /api/pedidos` | `admin`, `cajero` |
| `PATCH /api/pedidos/:id/estado` | `admin`, `cajero`, `cocinero` |

Las rutas públicas del portal cliente siguen operando sin sesión y usan únicamente los permisos directos del usuario `proy3`.

## Permisos DB por rol

| Rol PostgreSQL | Lectura | Escritura |
|---|---|---|
| `rol_admin` | Todas las tablas, vistas y secuencias del esquema `public` | CRUD completo sobre todas las tablas |
| `rol_cajero` | Lectura completa del esquema `public` para reportes, catálogo y pedidos | `INSERT/UPDATE` en `cliente`; `INSERT` en `pedido`, `pedido_item`, `pedido_item_modificacion`, `pago`, `movimiento_inventario`; `UPDATE` en `pedido`, `pago`, `insumo` |
| `rol_cocinero` | `cliente`, `empleado`, `pedido`, `pedido_item`, `pedido_item_modificacion`, `pago`, `producto`, `extra`, `v_resumen_pedidos` | `UPDATE` en `pedido` para avances de cocina |
| `rol_inventario` | `empleado`, `proveedor`, `insumo`, `compra_insumo`, `compra_insumo_detalle`, `movimiento_inventario`, `v_stock_critico` | `INSERT/UPDATE/DELETE` en `insumo`; `INSERT` en `compra_insumo`, `compra_insumo_detalle`, `movimiento_inventario` |
| `rol_analista` | Lectura completa del esquema `public` para dashboard, reportes y analítica | Sin permisos de escritura |

Permisos auxiliares:

- Los roles con `INSERT` reciben `USAGE` y `SELECT` sobre las secuencias necesarias.
- Todos los roles de negocio y `proy3` reciben `USAGE` sobre los tipos enum usados por la aplicación.
- El esquema `public` revoca `CREATE` a `PUBLIC`.

## Flujo de estados de pedidos

Transiciones válidas globales:

- `pendiente -> aprobado, cancelado`
- `aprobado -> en_proceso, cancelado`
- `en_proceso -> finalizado`
- `finalizado -> entregado`

Restricción adicional por rol:

| Rol app | Transiciones permitidas |
|---|---|
| `admin` | cualquier transición válida del flujo |
| `cajero` | `pendiente -> aprobado`, `pendiente -> cancelado`, `aprobado -> cancelado`, `finalizado -> entregado` |
| `cocinero` | `aprobado -> en_proceso`, `en_proceso -> finalizado` |

El backend devuelve:

- `409` si el estado destino no es válido para el estado actual.
- `403` si el estado es válido en el flujo general pero el rol no puede ejecutarlo.

## Usuarios semilla

Todos los empleados semilla usan la contraseña `admin123`.

| Email | Rol |
|---|---|
| `jose.perez@tacospepe.gt` | `admin` |
| `carlos.hernandez@tacospepe.gt` | `cajero` |
| `roberto.villalobos@tacospepe.gt` | `cocinero` |
| `noemi.soto@tacospepe.gt` | `inventario` |
| `esteban.castro@tacospepe.gt` | `analista` |

## Verificación SQL

El archivo [`db/consultas/verificacion_roles.sql`](/home/pablo/Documents/Sem5/DB/TacosElPepe/db/consultas/verificacion_roles.sql) contiene consultas reproducibles para:

- comprobar que existen exactamente los 5 roles de negocio `rol_admin`, `rol_cajero`, `rol_cocinero`, `rol_inventario`, `rol_analista`
- comprobar que también existe `proy3` como usuario técnico de conexión
- inspeccionar `role_table_grants`
- verificar `SET ROLE`
- confirmar que `rol_analista` no puede insertar en `producto`
- confirmar que `rol_inventario` sí puede insertar en `compra_insumo` dentro de una transacción de prueba con `ROLLBACK`
