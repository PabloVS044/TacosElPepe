# Tacos El Pepe

Aplicación de gestión de taquería

## Estructura del proyecto

```text
TacosElPepe/
├── backend/
├── db/
│   └── init/
│       ├── datos_prueba.sql
│       ├── estructura_bd.sql
│       └── indices.sql
├── docker/
├── docker-compose.yml
├── docs/
│   ├── diagramas/
│   │   ├── der_chen.png
│   │   └── modelo_relacional.png
│   └── entrega/
│       └── diseno_bd_tacos_el_pepe.pdf
├── frontend/
├── .env.example
├── .gitignore
└── README.md
```

## Contenido de `docs/`

- `docs/diagramas/`: diagramas del diseno de base de datos, incluyendo DER Chen y modelo relacional.
- `docs/entrega/`: archivos de apoyo para la entrega, como el PDF del diseno.

## Contenido de `db/`

- `db/init/`: scripts SQL de inicializacion que PostgreSQL ejecuta automaticamente solo la primera vez que se crea el volumen de datos.
- `estructura_bd.sql`: definicion principal de la base de datos.
- `indices.sql`: indices para optimizar consultas.
- `datos_prueba.sql`: datos iniciales para pruebas y validacion.

## Como levantar la base de datos

1. Copia el archivo de ejemplo a `.env`:

```bash
cp .env.example .env
```

2. Levanta PostgreSQL con Docker Compose:

```bash
docker compose up -d
```

3. Verifica que el servicio este corriendo:

```bash
docker compose ps
```

Si el puerto `5432` ya esta ocupado en tu maquina, cambia `POSTGRES_PORT` en tu archivo `.env` por otro valor libre, por ejemplo `5433`, y vuelve a ejecutar `docker compose up -d`.

Los scripts de `db/init/` se ejecutan automaticamente durante la primera inicializacion del contenedor, respetando el orden:

- `estructura_bd.sql`
- `indices.sql`
- `datos_prueba.sql`

## Conexion a la base de datos

- Desde tu maquina local, usando el puerto definido en `POSTGRES_PORT` dentro de `.env`:

```bash
psql -h localhost -p <POSTGRES_PORT> -U proy2 -d tacospepe
```

- Desde el contenedor:

```bash
docker compose exec db psql -U proy2 -d tacospepe
```

- En futuras fases, si agregas backend dentro del mismo Compose, el host sera `db`.

## Reinicializar la base de datos

Si quieres volver a ejecutar los scripts SQL desde cero, debes eliminar el volumen persistente y volver a levantar el servicio:

```bash
docker compose down -v
docker compose up -d
```

Esto borra completamente los datos actuales y vuelve a correr la inicializacion.

## Carpetas preparadas para siguientes fases

- `backend/`: base inicial para el desarrollo del servidor y la logica de negocio.
- `frontend/`: base inicial para la interfaz web.
- `docker/`: espacio reservado para configuracion de contenedores y orquestacion.

Estas carpetas se iran completando en las siguientes fases del proyecto.

## Estado actual

Actualmente el proyecto tiene organizada la documentacion del diseno de base de datos y la base PostgreSQL ya queda preparada para ejecutarse con Docker Compose. La integracion con backend y frontend queda lista para una siguiente fase sin rehacer la estructura.
