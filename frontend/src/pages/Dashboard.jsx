import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import LoadingScreen from '../components/LoadingScreen';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [daily, setDaily] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError('');

      const results = await Promise.allSettled([
        api.get('/reportes/diario'),
        api.get('/consultas/views/pedidos-resumen'),
        api.get('/consultas/views/stock-critico'),
        api.get('/reportes/ventas'),
      ]);

      if (ignore) return;

      const [dailyRes, ordersRes, stockRes, ventasRes] = results;

      if (dailyRes.status === 'fulfilled') setDaily(dailyRes.value.datos || []);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.datos || []);
      if (stockRes.status === 'fulfilled') setStock(stockRes.value.datos || []);
      if (ventasRes.status === 'fulfilled') setVentas(ventasRes.value.datos || []);

      const failed = results.every((result) => result.status === 'rejected');
      if (failed) setError('No se pudo cargar el resumen del dashboard.');

      setLoading(false);
    }

    load();
    return () => { ignore = true; };
  }, []);

  const latestDaily = daily[0];
  const activeOrders = orders.filter((order) => !['entregado', 'cancelado'].includes(order.estado_pedido));
  const delayedOrders = orders.filter((order) => ['pendiente', 'aprobado', 'en_proceso'].includes(order.estado_pedido));
  const topProducts = ventas.slice(0, 5);

  const quickActions = useMemo(() => {
    if (user?.rol === 'cocinero') {
      return [
        { to: '/pedidos', label: 'Ver pedidos activos', icon: 'receipt-cutoff' },
      ];
    }

    const actions = [
      { to: '/pos', label: 'Abrir POS', icon: 'display' },
      { to: '/pedidos', label: 'Monitor de pedidos', icon: 'kanban' },
    ];

    if (user?.rol === 'admin') {
      actions.push(
        { to: '/insumos/reabastecer', label: 'Reabastecer insumos', icon: 'cart-plus' },
        { to: '/reportes', label: 'Ir a reportes', icon: 'bar-chart-line' },
      );
    }

    return actions;
  }, [user?.rol]);

  if (loading) return <LoadingScreen message="Armando el dashboard..." />;

  return (
    <AppShell
      title="Dashboard operativo"
      subtitle="Vista general rápida para arrancar turno y detectar prioridades."
    >
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3">
          <MetricCard
            label="Ventas del período"
            value={latestDaily ? `Q${Number(latestDaily.total_ventas).toFixed(2)}` : 'Q0.00'}
            hint={latestDaily ? new Date(latestDaily.fecha).toLocaleDateString('es-GT') : 'Sin datos'}
            icon="cash-stack"
            tone="primary"
          />
        </div>
        <div className="col-md-6 col-xl-3">
          <MetricCard
            label="Pedidos activos"
            value={activeOrders.length}
            hint="pendientes a entregarse"
            icon="receipt"
            tone="warning"
          />
        </div>
        <div className="col-md-6 col-xl-3">
          <MetricCard
            label="Alertas de stock"
            value={stock.length}
            hint="insumos bajo mínimo"
            icon="exclamation-triangle"
            tone="danger"
          />
        </div>
        <div className="col-md-6 col-xl-3">
          <MetricCard
            label="Pedidos en cocina"
            value={delayedOrders.length}
            hint="flujo actual"
            icon="clock-history"
            tone="info"
          />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-xl-4">
          <div className="surface-card h-100 p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <div className="small text-uppercase text-muted fw-semibold">Atajos</div>
                <h2 className="h4 mb-0">Acciones rápidas</h2>
              </div>
              <div className="product-icon">⚡</div>
            </div>
            <div className="d-grid gap-3">
              {quickActions.map((action) => (
                <Link key={action.to} to={action.to} className="surface-panel p-3 text-decoration-none text-dark d-flex justify-content-between align-items-center">
                  <div className="fw-semibold">
                    <i className={`bi bi-${action.icon} me-2 text-brand`} />
                    {action.label}
                  </div>
                  <i className="bi bi-arrow-right text-muted" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="col-xl-8">
          <div className="surface-card h-100 p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <div className="small text-uppercase text-muted fw-semibold">Top del día</div>
                <h2 className="h4 mb-0">Productos con más movimiento</h2>
              </div>
              <Link to="/reportes" className="btn btn-brand-outline btn-sm">Ver reportes</Link>
            </div>
            <div className="table-responsive">
              <table className="table table-app align-middle mb-0">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th className="text-end">Unidades</th>
                    <th className="text-end">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty-state py-4">
                          <p className="mb-0 text-muted">No hay datos de ventas para mostrar.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {topProducts.map((item) => (
                    <tr key={item.producto}>
                      <td className="fw-semibold">{item.producto}</td>
                      <td>{item.categoria}</td>
                      <td className="text-end">{item.unidades_vendidas}</td>
                      <td className="text-end fw-semibold">Q{Number(item.ingresos_totales).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-7">
          <div className="surface-card p-4 h-100 overflow-hidden d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <div className="small text-uppercase text-muted fw-semibold">Flujo operativo</div>
                <h2 className="h4 mb-0">Pedidos que requieren atención</h2>
              </div>
              <Link to="/pedidos" className="btn btn-brand-outline btn-sm">Abrir monitor</Link>
            </div>
            <div className="table-responsive flex-grow-1 overflow-y-auto" style={{ maxHeight: '28rem' }}>
              <table className="table table-app align-middle mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Canal</th>
                    <th>Estado</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrders.slice(0, 8).map((order) => (
                    <tr key={order.id_pedido}>
                      <td className="fw-semibold">#{order.id_pedido}</td>
                      <td>{order.cliente}</td>
                      <td className="text-capitalize">{order.canal}</td>
                      <td><StatusBadge value={order.estado_pedido} /></td>
                      <td className="text-end fw-semibold">Q{Number(order.total).toFixed(2)}</td>
                    </tr>
                  ))}
                  {activeOrders.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state py-4">
                          <p className="mb-0 text-muted">No hay pedidos activos en este momento.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-xl-5">
          <div className="surface-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <div className="small text-uppercase text-muted fw-semibold">Insumos críticos</div>
                <h2 className="h4 mb-0">Stock a vigilar</h2>
              </div>
              <Link to="/insumos/reabastecer" className="btn btn-brand-outline btn-sm">Reabastecer</Link>
            </div>

            <div className="d-grid gap-3">
              {stock.slice(0, 5).map((item) => (
                <div key={item.id_insumo} className="surface-panel p-3">
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <div className="fw-semibold">{item.insumo}</div>
                      <div className="small text-muted">{item.proveedor}</div>
                    </div>
                    <div className="text-end">
                      <div className="small text-uppercase text-muted">Déficit</div>
                      <div className="fw-bold text-danger">{Number(item.deficit).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
              {stock.length === 0 && (
                <div className="empty-state py-4">
                  <p className="mb-0 text-muted">No hay alertas de stock por ahora.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
