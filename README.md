# Tacos El Pepe

Sistema web de gestión de inventario y ventas para una taquería.
Proyecto universitario — Bases de Datos 1.

## Stack

- **Base de datos**: PostgreSQL 16 (Docker)
- **Backend**: Node.js + Express + `pg` (API JSON) — sesiones con `express-session`, contraseñas con `bcryptjs` y activación de rol DB con `SET LOCAL ROLE`
- **ORM**: Sequelize 6 sobre PostgreSQL para operaciones CRUD de catálogo e inventario
- **Frontend**: React 18 + Vite + React Router v6 + Tailwind CSS 4
- **Orquestación**: Docker Compose con `db`, `backend` y `frontend`
- **Arquitectura**: backend por capas (`routes -> controllers -> services -> models -> queries`) y frontend dividido entre portal cliente y backoffice

## Estructura del proyecto

```text
TacosElPepe/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── scripts/
│   │   ├── ensure-runtime.js     <- espera la BD y verifica semillas de seguridad
│   │   └── seed-passwords.js     <- lista credenciales semilla disponibles
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   ├── db.js
│       │   └── session.js
│       ├── controllers/          <- capa HTTP por módulo
│       ├── middleware/           <- auth, manejo de errores y async handlers
│       ├── models/               <- acceso a datos por dominio
│       ├── queries/              <- SQL parametrizado
│       ├── routes/
│       │   ├── auth.js           <- login, logout y sesión actual
│       │   ├── productos.js      <- CRUD de productos
│       │   ├── insumos.js        <- CRUD y datos auxiliares de inventario
│       │   ├── comprasInsumos.js <- compras de insumos transaccionales
│       │   ├── pedidos.js        <- catálogo, clientes, pedidos y cambios de estado
│       │   ├── reportes.js       <- ventas, diario, ranking y clientes frecuentes
│       │   ├── consultas.js      <- joins, subqueries y views expuestos por API
│       │   └── index.js
│       ├── services/             <- reglas de negocio, transacciones e invocación de stored procedures
│       ├── orm/                  <- Sequelize: instancia y modelos (Producto, Insumo, Cliente)
│       └── utils/                <- errores y utilidades
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js            <- proxy /api → backend interno de Docker
│   └── src/
│       ├── App.jsx               <- rutas públicas y protegidas
│       ├── api/api.js            <- fetch wrapper con credentials
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── CustomerUiContext.jsx
│       ├── components/
│       │   ├── BackofficeLayout.jsx
│       │   ├── AppSidebar.jsx
│       │   ├── ProductCustomizer.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── PublicOnlyRoute.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── analytics/
│           │   └── SqlInsights.jsx
│           ├── productos/
│           │   ├── ProductosList.jsx
│           │   └── ProductoForm.jsx
│           ├── insumos/
│           │   ├── InsumosList.jsx
│           │   ├── InsumoForm.jsx
│           │   └── StockCenter.jsx
│           ├── pedidos/
│           │   └── OrdersBoard.jsx
│           ├── pos/
│           │   └── PosTerminal.jsx
│           ├── public/
│           │   ├── ClientMenu.jsx
│           │   ├── ClientCheckout.jsx
│           │   └── ClientTracking.jsx
│           └── reportes/
│               ├── ReportsHub.jsx
│               ├── ReporteVentas.jsx
│               └── ReporteDiario.jsx
├── db/
│   ├── consultas/                <- consultas auxiliares y verificación SQL
│   └── init/sql/                 <- estructura, índices, views, stored procedures, roles y datos de prueba 
├── docker-compose.yml
├── .env.example
└── README.md
```

## Requisitos

### Recomendado: ejecución con Docker

- Docker con soporte para `docker compose`
- Git
- Puertos libres `5173` y `5433` en la máquina host

### Windows 10/11

- Docker Desktop instalado
- WSL 2 habilitado e integrado con Docker Desktop
- Ejecutar los comandos desde PowerShell o Git Bash

### macOS

- Docker Desktop para Mac instalado
- Terminal.app o iTerm2

### Linux

- Docker Engine instalado
- Docker Compose plugin instalado
- Usuario con permisos para usar Docker, o ejecutar comandos con `sudo`

### Desarrollo local opcional

- Node.js 20+ recomendado
- `npm`
- PostgreSQL local o el contenedor `db` del proyecto

## Configuración inicial

### 1. Variables de entorno

Linux o macOS:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Windows CMD:

```bat
copy .env.example .env
```

El `.env` ya tiene valores por defecto listos para desarrollo:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=tacospepe
POSTGRES_PORT=5433

DB_HOST=localhost
DB_PORT=5433
DB_USER=proy3
DB_PASSWORD=secret
PORT=3000
SESSION_SECRET=G9qW3Lx8Ns2Vb7Km4Pd1Yt6Hr0Cf5Ju9Re3Xa8Mz2Uk7Wp4Dn1Tv6Bh0Qs5Lc8Ef
FRONTEND_URL=http://localhost:5173
FRONTEND_PORT=5173
```

### 2. Levantar todo el proyecto

```bash
docker compose up --build
```

Esto construye y levanta los 3 servicios:
- `db` — PostgreSQL 16 con scripts de inicialización automáticos
- `backend` — API Express disponible dentro de la red de Docker en `http://backend:3000`
- `frontend` — React + Vite en `http://localhost:5173`

Notas por sistema:
- En Windows y macOS asegúrate de tener Docker Desktop abierto antes de correr el comando.
- En Linux, si `docker compose` responde con permisos insuficientes, usa `sudo docker compose up --build` o agrega tu usuario al grupo `docker`.
- Después de la primera construcción puedes usar `docker compose up` sin `--build` mientras no cambien dependencias o Dockerfiles.

Durante el arranque:
- PostgreSQL ejecuta `estructura_bd.sql`, `indices.sql`, `views.sql`, `procedimientos.sql`, `datos_prueba.sql` y `seguridad_roles.sql`
- El backend espera a que la base esté lista
- Los empleados semilla ya quedan funcionales desde `datos_prueba.sql`
- El frontend publica la app y proxya `/api` hacia el backend interno

Si ya habías levantado el proyecto antes de estos cambios, elimina el volumen para regenerar roles, usuario técnico y semillas:

```bash
docker compose down -v
docker compose up --build
```

Puedes verificar el estado con:

```bash
docker compose ps
```

## Accesos después del arranque

- App web: `http://localhost:5173`
- Base de datos desde DBeaver/psql en el host: `localhost:5433`
- Base de datos dentro de Docker: host `db`, puerto `5432`
- Usuario de aplicación para calificación: `proy3`
- Contraseña de aplicación para calificación: `secret`

## Credenciales de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| jose.perez@tacospepe.gt | admin123 | admin |
| carlos.hernandez@tacospepe.gt | admin123 | cajero |
| roberto.villalobos@tacospepe.gt | admin123 | cocinero |
| noemi.soto@tacospepe.gt | admin123 | inventario |
| esteban.castro@tacospepe.gt | admin123 | analista |

Todos los empleados semilla usan la contraseña `admin123`.

## Seguridad y roles

- La autenticación usa sesión HTTP y cada empleado conserva su rol en `req.session.user`.
- PostgreSQL define exactamente 5 roles de negocio: `rol_admin`, `rol_cajero`, `rol_cocinero`, `rol_inventario`, `rol_analista`.
- El backend se conecta con el usuario técnico `proy3` y activa el rol DB correcto por request autenticado mediante `SET LOCAL ROLE`.

## Stored Procedures

Las operaciones críticas del negocio se ejecutan mediante stored procedures definidos en [db/init/sql/procedimientos.sql](db/init/sql/procedimientos.sql) e invocados desde la capa de servicios del backend.

| Stored Procedure | Invocado desde | Descripción |
|------------------|----------------|-------------|
| `sp_crear_pedido` | `services/orderService.js` | Crea pedido + pago + items + modificaciones. Usa parámetros `IN`/`OUT` (`o_id_pedido`, `o_total`) y bloque `EXCEPTION` |
| `sp_descontar_stock_pedido` | `services/orderService.js` | Descuenta inventario y registra movimientos de salida |
| `sp_registrar_compra_insumo` | `services/compraInsumoService.js` | **PROCEDURE** invocado con `CALL`. Registra compra, actualiza stock e inserta movimientos de entrada con control de transacción explícito: `COMMIT` al confirmar y `ROLLBACK` si el total recibido no coincide con el calculado |
| `sp_cancelar_pedido` | `services/orderService.js` | Restaura inventario, reembolsa pago y cancela el pedido |
| `sp_cambiar_estado_pedido` | `services/orderService.js` | Aplica una transición de estado con timestamps y empleado asignado |

- **Parámetros IN/OUT + manejo de excepciones**: `sp_crear_pedido`.
- **Transacción con ROLLBACK dentro de un SP**: `sp_registrar_compra_insumo` es una `PROCEDURE` con `COMMIT` y `ROLLBACK` explícitos; se invoca con `CALL` desde el backend (sin transacción externa abierta).
- Los permisos `EXECUTE` se otorgan por rol en [db/init/sql/seguridad_roles.sql](db/init/sql/seguridad_roles.sql).

## ORM (Sequelize)

El ORM está configurado en [backend/src/orm/](backend/src/orm/) y se usa en operaciones CRUD de la aplicación:

| Operación | Modelo | Método Sequelize | Servicio |
|-----------|--------|------------------|----------|
| Leer insumo por ID | `Insumo` | `Insumo.findByPk()` | `insumoService.getInsumo` |
| Crear insumo | `Insumo` | `Insumo.create()` | `insumoService.createInsumo` |
| Actualizar insumo | `Insumo` | `Insumo.update()` | `insumoService.updateInsumo` |
| Eliminar producto | `Producto` | `Producto.destroy()` | `productService.deleteProduct` |

Las consultas avanzadas (joins, subqueries, reportes con CTE) se mantienen en SQL explícito, como permite el enunciado.

## Funcionalidades

### Portal cliente
- Menú público de autoservicio con catálogo, combos, disponibilidad y personalización de productos
- Checkout para cliente final con captura de nombre, teléfono y método de pago
- Seguimiento de pedido por código con refresco automático y línea de tiempo de estados

### Autenticación y backoffice
- Login y logout con sesión persistida por cookie
- Rutas protegidas y navegación según rol dentro del backoffice (`admin`, `cajero`, `cocinero`, `inventario`, `analista`)
- Dashboard operativo con KPIs, pedidos activos, stock crítico y productos destacados

### Ventas y pedidos
- Terminal POS para mostrador con carrito, ticket, cliente general o registrado y personalizaciones
- Monitor de pedidos para caja/cocina con detalle, cambio de estado y auto-refresh
- Descuento automático de inventario al crear pedidos
- Cancelación con restauración de inventario basada en movimientos registrados

### Inventario y abastecimiento
- CRUD completo de productos
- CRUD completo de insumos
- Vista de reabastecimiento con stock crítico, proveedores y registro de compras
- Compras de insumos ejecutadas dentro de transacciones para mantener consistencia

### Reportes y analítica SQL
- **Ventas** (`/reportes/ventas`): productos más vendidos, ingresos y participación sobre el total
- **Diario** (`/reportes/diario`): ventas por día, ticket promedio y número de pedidos
- **Clientes frecuentes** y **ranking de productos** desde el hub de reportes
- Pantalla de analítica SQL con joins, subqueries y views consumidos desde la API

## API principal

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/productos/categorias`, `GET /api/productos`, `GET /api/productos/:id`, `POST /api/productos`, `PUT /api/productos/:id`, `DELETE /api/productos/:id`
- `GET /api/insumos/proveedores`, `GET /api/insumos`, `GET /api/insumos/:id`, `POST /api/insumos`, `PUT /api/insumos/:id`, `DELETE /api/insumos/:id`
- `POST /api/compras-insumos`
- `GET /api/pedidos/catalogo`, `GET /api/pedidos/seguimiento/:codigo`, `POST /api/pedidos/online`
- `GET /api/pedidos/clientes`, `GET /api/pedidos`, `GET /api/pedidos/:id`, `POST /api/pedidos`, `PATCH /api/pedidos/:id/estado`
- `GET /api/reportes/*`
- `GET /api/consultas/joins/*`, `GET /api/consultas/subqueries/*`, `GET /api/consultas/views/*`
- `GET /api/health`

## Consultas SQL relevantes (Parte II)

Los archivos SQL están en `db/consultas/`:

| Archivo | Contenido |
|---------|-----------|
| `consultas_join.sql` | 3 consultas con JOIN múltiple |
| `consultas_subquery.sql` | Subqueries con EXISTS y FROM |
| `consultas_reportes.sql` | GROUP BY, HAVING, CTE con ranking |
| `views.sql` | `v_resumen_pedidos` y `v_stock_critico` |
| `transaccion_compra.sql` | Transacción con ROLLBACK para compras |

Las consultas de los reportes de la app se ejecutan directamente desde el backend:
- JOIN de 4 tablas en `GET /reportes/ventas`
- GROUP BY + SUM en `GET /reportes/diario`
- JOIN de 2 tablas en `GET /productos` y `GET /insumos`

## Reiniciar la base de datos

```bash
docker compose down -v
docker compose up --build
```

## Conexión directa a la base de datos

```bash
docker compose exec db psql -U proy3 -d tacospepe
```

Para ejecutar la verificación reproducible de permisos:

```bash
docker compose exec -T db psql -U proy3 -d tacospepe < db/consultas/verificacion_roles.sql
```

## Desarrollo local opcional

Si quieres correr frontend y backend fuera de Docker, los comandos son los mismos en Linux, macOS y Windows usando PowerShell o Git Bash:

```bash
cd backend
npm install
npm start
```

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Para este modo:
- deja la base Docker levantada con `docker compose up db`
- usa `DB_HOST=localhost` y `DB_PORT=5433` en `.env`
- usa `DB_USER=proy3` y `DB_PASSWORD=secret` en `.env`
- el backend local corre en `http://localhost:3000`
- el frontend local corre en `http://localhost:5173`

Si cambias `POSTGRES_PORT` para publicar la base en otro puerto, ajusta también `DB_PORT`.
Si `PORT` o `FRONTEND_PORT` ya están ocupados en tu máquina, cambia esas variables en `.env`.
Si cambias `FRONTEND_PORT`, ajusta también `FRONTEND_URL`.
