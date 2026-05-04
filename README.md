# Tacos El Pepe

Sistema web de gestión de inventario y ventas para una taquería.
Proyecto universitario — Bases de Datos 1.

## Stack

- **Base de datos**: PostgreSQL 16 (Docker)
- **Backend**: Node.js + Express (API JSON) — express-session + bcryptjs
- **Frontend**: React 18 + Vite + Bootstrap 5 + React Router v6
- **Autenticación**: express-session con cookies, proxy Vite → backend

## Estructura del proyecto

```
TacosElPepe/
├── backend/
│   ├── package.json
│   ├── scripts/
│   │   └── seed-passwords.js     <- asigna contraseñas reales a los empleados
│   └── src/
│       ├── app.js                <- API JSON en puerto 3000
│       ├── config/db.js
│       ├── middleware/requireAuth.js
│       └── routes/
│           ├── auth.js           <- POST /api/auth/login, POST /api/auth/logout
│           ├── productos.js      <- CRUD /api/productos
│           ├── insumos.js        <- CRUD /api/insumos
│           └── reportes.js       <- GET /api/reportes/ventas, /api/reportes/diario
├── frontend/
│   ├── package.json
│   ├── vite.config.js            <- proxy /api → localhost:3000
│   └── src/
│       ├── App.jsx               <- rutas React Router
│       ├── api/api.js            <- fetch wrapper con credentials
│       ├── context/AuthContext.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── ProtectedRoute.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── productos/
│           │   ├── ProductosList.jsx
│           │   └── ProductoForm.jsx
│           ├── insumos/
│           │   ├── InsumosList.jsx
│           │   └── InsumoForm.jsx
│           └── reportes/
│               ├── ReporteVentas.jsx
│               └── ReporteDiario.jsx
├── db/
│   ├── consultas/                <- consultas SQL de la Parte II
│   └── init/sql/                 <- scripts de inicialización
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
POSTGRES_PORT=5432

DB_HOST=localhost
DB_PORT=5432
PORT=3000
SESSION_SECRET=tacos_el_pepe_dev_secret_2024
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

### Autenticación
- Login y logout con sesión
- Rutas protegidas — redirige al login si no hay sesión activa

### CRUD de Productos
- Listado con categoría, precio y disponibilidad
- Crear, editar y eliminar productos
- Validación de campos obligatorios
- Mensajes de error/éxito visibles al usuario
- Manejo de FK (no permite eliminar si tiene pedidos)

### CRUD de Insumos
- Listado con proveedor y alerta visual de stock crítico
- Crear, editar y eliminar insumos
- Validación de campos obligatorios

### Reportes
- **Productos más vendidos** (`/reportes/ventas`): ordenados por ingresos, con porcentaje del total
- **Ventas diarias** (`/reportes/diario`): últimos 30 días con conteo, total y ticket promedio

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

Si cambias `POSTGRES_PORT` para publicar la base en otro puerto, ajusta también `DB_PORT`.
Si `PORT` o `FRONTEND_PORT` ya están ocupados en tu máquina, cambia esas variables en `.env`.
Si cambias `FRONTEND_PORT`, ajusta también `FRONTEND_URL`.
