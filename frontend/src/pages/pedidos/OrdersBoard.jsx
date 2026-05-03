import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import LoadingScreen from '../../components/LoadingScreen';
import StatusBadge from '../../components/StatusBadge';
import { api } from '../../api/api';

const STATUS_COLUMNS = [
  { key: 'pendiente', title: 'Pendientes', tone: 'text-amber-700 bg-amber-100' },
  { key: 'aprobado', title: 'Aprobados', tone: 'text-violet-700 bg-violet-100' },
  { key: 'en_proceso', title: 'En proceso', tone: 'text-sky-700 bg-sky-100' },
  { key: 'finalizado', title: 'Finalizados', tone: 'text-stone-700 bg-stone-200' },
  { key: 'entregado', title: 'Entregados', tone: 'text-emerald-700 bg-emerald-100' },
];

const NAME_CLAMP = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

function money(value) {
  return `Q${Number(value || 0).toFixed(2)}`;
}

function formatHour(value) {
  return new Date(value).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrdersBoard() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadOrders = async () => {
    try {
      const response = await api.get('/consultas/views/pedidos-resumen');
      setOrders(response.datos);
      setLastUpdate(new Date());
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return orders;
    }

    return orders.filter((order) => (
      String(order.id_pedido).includes(normalizedSearch)
      || order.cliente?.toLowerCase().includes(normalizedSearch)
      || order.canal?.toLowerCase().includes(normalizedSearch)
      || order.estado_pedido?.toLowerCase().includes(normalizedSearch)
    ));
  }, [orders, search]);

  const ordersByStatus = useMemo(() => (
    STATUS_COLUMNS.map((column) => ({
      ...column,
      items: filteredOrders.filter((order) => order.estado_pedido === column.key),
    }))
  ), [filteredOrders]);

  const summary = useMemo(() => {
    const active = filteredOrders.filter((order) => !['entregado', 'cancelado'].includes(order.estado_pedido));
    const online = filteredOrders.filter((order) => order.canal?.toLowerCase() === 'online');
    const mostrador = filteredOrders.filter((order) => order.canal?.toLowerCase() === 'mostrador');
    const total = filteredOrders.reduce((acc, order) => acc + Number(order.total || 0), 0);

    return {
      active: active.length,
      online: online.length,
      mostrador: mostrador.length,
      total,
    };
  }, [filteredOrders]);

  if (loading) {
    return <LoadingScreen label="Cargando monitor de pedidos..." />;
  }

  return (
    <AppShell
      title="Monitor de pedidos"
      subtitle="Vista amplia para cocina y caja. Ideal para refrescar y revisar estados rapidamente."
      actions={(
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-[var(--app-border)] bg-white/90 px-4 py-3 text-sm text-[var(--app-text-muted)] shadow-[var(--shadow-soft)]">
            {lastUpdate
              ? `Actualizado ${lastUpdate.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`
              : 'Sin actualizacion'}
          </div>
          <button
            type="button"
            className="inline-flex min-h-[3.25rem] items-center justify-center rounded-2xl bg-[var(--brand)] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(114,14,16,0.22)] transition hover:bg-[var(--brand-dark)]"
            onClick={loadOrders}
          >
            Refrescar
          </button>
        </div>
      )}
    >
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(24rem,0.8fr)]">
        <div className="surface-card p-4 sm:p-5">
          <label className="form-label text-muted small text-uppercase">Buscar pedido o cliente</label>
          <input
            className="form-control form-control-lg"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ej. 104, Juan Perez, online..."
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="surface-panel px-3 py-3">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                Activos
              </div>
              <div className="mt-1 text-xl font-extrabold text-[var(--brand)]">{summary.active}</div>
            </div>
            <div className="surface-panel px-3 py-3">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                Online
              </div>
              <div className="mt-1 text-xl font-extrabold text-[var(--brand)]">{summary.online}</div>
            </div>
            <div className="surface-panel px-3 py-3">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                Mostrador
              </div>
              <div className="mt-1 text-xl font-extrabold text-[var(--brand)]">{summary.mostrador}</div>
            </div>
            <div className="surface-panel px-3 py-3">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                Importe visible
              </div>
              <div className="mt-1 text-xl font-extrabold text-[var(--brand)]">{money(summary.total)}</div>
            </div>
          </div>
        </div>

        <div className="surface-card p-4 sm:p-5">
          <div className="small text-uppercase text-muted fw-semibold">Lectura rapida</div>
          <h2 className="h5 mt-2 mb-3">Flujo actual del monitor</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {ordersByStatus.map((column) => (
              <div key={column.key} className="surface-panel d-flex justify-content-between align-items-center gap-3 px-3 py-3">
                <div>
                  <div className="small text-uppercase text-muted">{column.title}</div>
                  <div className="fw-semibold">{column.items.length} pedidos</div>
                </div>
                <span className={`inline-flex min-h-[2.25rem] min-w-[2.25rem] items-center justify-center rounded-full px-3 text-sm font-bold ${column.tone}`}>
                  {column.items.length}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid items-start gap-4 md:grid-cols-2 xl:flex xl:overflow-x-auto xl:pb-2">
        {ordersByStatus.map((column) => (
          <section key={column.key} className="min-w-0 xl:w-[18.75rem] xl:shrink-0">
            <div className="surface-card flex h-auto min-h-[18rem] flex-col p-4 xl:h-[calc(100vh-16rem)]">
              <div className="mb-4 d-flex justify-content-between align-items-center gap-3">
                <div>
                  <div className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                    {column.title}
                  </div>
                  <div className="mt-1 text-lg font-bold text-[var(--app-text)]">{column.items.length} pedidos</div>
                </div>
                <StatusBadge status={column.key} />
              </div>

              {!column.items.length ? (
                <div className="surface-panel flex flex-1 items-center justify-center px-4 py-6 text-center">
                  <div>
                    <div className="text-[2rem] text-[var(--app-border-strong)]">
                      <i className="bi bi-check2-circle" />
                    </div>
                    <div className="mt-2 font-semibold text-[var(--app-text)]">Sin pedidos</div>
                    <div className="mt-1 text-sm text-[var(--app-text-muted)]">
                      No hay elementos en esta columna.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {column.items.map((order) => (
                    <article key={order.id_pedido} className="surface-panel bg-white px-4 py-4 shadow-[var(--shadow-soft)]">
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div className="min-w-0">
                          <div className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
                            {order.canal}
                          </div>
                          <div className="mt-1 text-[1.05rem] font-bold leading-tight text-[var(--app-text)]">
                            Pedido #{order.id_pedido}
                          </div>
                        </div>
                        <div className="shrink-0 text-end">
                          <div className="text-lg font-extrabold leading-none text-[var(--app-text)]">
                            {money(order.total)}
                          </div>
                          <div className="mt-1 text-sm text-[var(--app-text-muted)]">
                            {order.metodo_pago || 'Sin pago'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 text-sm leading-5 text-[var(--app-text-muted)]" style={NAME_CLAMP}>
                        {order.cliente}
                      </div>

                      <div className="mt-4 d-flex justify-content-between align-items-center gap-3">
                        <StatusBadge status={order.estado_pedido} />
                        <span className="text-sm text-[var(--app-text-muted)]">
                          {formatHour(order.fecha_creacion)}
                        </span>
                      </div>

                      <div className="mt-4 rounded-2xl border border-[var(--app-border)] bg-white px-3 py-3 text-sm text-[var(--app-text-muted)]">
                        <span className="font-semibold text-[var(--app-text)]">Cajero:</span> {order.cajero || 'Sin asignar'}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
