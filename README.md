# Tacos El Pepe

Sistema web de gestión de inventario y ventas para una taquería.
Proyecto universitario — Bases de Datos 1.

## Stack

- **Base de datos**: PostgreSQL 16 (Docker)
- **Backend**: Node.js + Express + `pg` (API JSON) — sesiones con `express-session` y contraseñas con `bcryptjs`
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
│   │   ├── ensure-runtime.js     <- espera la BD y prepara credenciales en Docker
│   │   └── seed-passwords.js     <- reasigna contraseñas en desarrollo local
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
│       ├── services/             <- reglas de negocio y transacciones
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
│   ├── consultas/                <- joins, subqueries, reportes y transacciones de la Parte II
│   └── init/sql/                 <- estructura, índices, views y datos de prueba
├── docker-compose.yml
├── .env.example
└── README.md
```

## Configuración inicial

### 1. Variables de entorno

```bash
cp .env.example .env
```

El `.env` ya tiene valores por defecto listos para desarrollo:

```env
POSTGRES_USER=proy2
POSTGRES_PASSWORD=secret
POSTGRES_DB=tacospepe
POSTGRES_PORT=5433

DB_HOST=localhost
DB_PORT=5433
PORT=3000
SESSION_SECRET=G9qW3Lx8Ns2Vb7Km4Pd1Yt6Hr0Cf5Ju9Re3Xa8Mz2Uk7Wp4Dn1Tv6Bh0Qs5Lc8Ef
FRONTEND_URL=http://localhost:5173
FRONTEND_PORT=5173
```

### 2. Levantar todo el proyecto

```bash
docker compose up
```

Esto construye y levanta los 3 servicios:
- `db` — PostgreSQL 16 con scripts de inicialización automáticos
- `backend` — API Express disponible dentro de la red de Docker en `http://backend:3000`
- `frontend` — React + Vite en `http://localhost:5173`

Durante el arranque:
- PostgreSQL ejecuta `estructura_bd.sql`, `indices.sql`, `views.sql` y `datos_prueba.sql`
- El backend espera a que la base esté lista
- El backend corrige automáticamente los hashes placeholder de empleados para dejar el login usable sin pasos manuales
- El frontend publica la app y proxya `/api` hacia el backend interno

Puedes verificar el estado con:

```bash
docker compose ps
```

## Credenciales de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| jose.perez@tacospepe.gt | admin123 | admin |
| maria.gonzalez@tacospepe.gt | admin123 | admin |
| carlos.hernandez@tacospepe.gt | admin123 | cajero |
| roberto.villalobos@tacospepe.gt | admin123 | cocinero |

Todos los empleados usan la contraseña `admin123` después del arranque de Docker.

## Funcionalidades

### Portal cliente
- Menú público de autoservicio con catálogo, combos, disponibilidad y personalización de productos
- Checkout para cliente final con captura de nombre, teléfono y método de pago
- Seguimiento de pedido por código con refresco automático y línea de tiempo de estados

### Autenticación y backoffice
- Login y logout con sesión persistida por cookie
- Rutas protegidas y navegación según rol dentro del backoffice
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
docker compose up
```

## Conexión directa a la base de datos

```bash
docker compose exec db psql -U proy2 -d tacospepe
```

## Desarrollo local opcional

Si quieres correr frontend y backend fuera de Docker:

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

Si levantaste la base sin pasar por el contenedor `backend`, ejecuta una vez:

```bash
cd backend
npm run seed
```

Si cambias `POSTGRES_PORT` para publicar la base en otro puerto, ajusta también `DB_PORT`.
Si `PORT` o `FRONTEND_PORT` ya están ocupados en tu máquina, cambia esas variables en `.env`.
Si cambias `FRONTEND_PORT`, ajusta también `FRONTEND_URL`.
