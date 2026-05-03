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
POSTGRES_PORT=5433

DB_HOST=localhost
PORT=3000
SESSION_SECRET=tacos_el_pepe_dev_secret_2024
```

### 2. Levantar la base de datos

```bash
docker compose up -d
```

Esto crea el contenedor PostgreSQL y ejecuta automáticamente los scripts SQL:
- `estructura_bd.sql` — crea todas las tablas
- `indices.sql` — crea índices de rendimiento
- `datos_prueba.sql` — inserta datos de prueba

Verifica que el contenedor esté listo:

```bash
docker compose ps
```

### 3. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 4. Asignar contraseñas reales a los empleados

Los datos de prueba tienen hashes placeholder. Ejecuta esto una sola vez:

```bash
cd backend
npm run seed
```

Esto actualiza los 28 empleados de prueba para que puedan iniciar sesión.

### 5. Iniciar el backend

```bash
cd backend
npm start
```

La API estará disponible en: **http://localhost:3000**

Para desarrollo con recarga automática:

```bash
npm run dev
```

### 6. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

### 7. Iniciar el frontend

En otra terminal:

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en: **http://localhost:5173**

El frontend se conecta al backend mediante el proxy de Vite — ambos procesos deben estar corriendo.

## Credenciales de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| jose.perez@tacospepe.gt | admin123 | admin |
| maria.gonzalez@tacospepe.gt | admin123 | admin |
| carlos.hernandez@tacospepe.gt | admin123 | cajero |
| roberto.villalobos@tacospepe.gt | admin123 | cocinero |

Todos los empleados usan la contraseña `admin123` después de correr `npm run seed`.

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
docker compose up -d
# Esperar que el contenedor esté listo, luego:
cd backend && npm run seed
```

## Conexión directa a la base de datos

```bash
docker compose exec db psql -U proy2 -d tacospepe
```
