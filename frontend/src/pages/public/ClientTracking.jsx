import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import { useCustomerUi } from '../../context/CustomerUiContext';

const TIMELINE = ['pendiente', 'aprobado', 'en_proceso', 'finalizado', 'entregado'];

export default function ClientTracking() {
  const [searchParams] = useSearchParams();
  const { latestOrder, getOrderByCode } = useCustomerUi();
  const initialCode = searchParams.get('codigo') || latestOrder?.codigo || '';
  const [codigo, setCodigo] = useState(initialCode);

  const order = useMemo(() => {
    if (!codigo) return latestOrder;
    return getOrderByCode(codigo);
  }, [codigo, latestOrder, getOrderByCode]);

  const currentStep = order ? TIMELINE.indexOf(order.dynamicStatus || order.status) : -1;

  return (
    <div className="min-vh-100 py-4">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <div className="min-w-0">
            <div className="small text-uppercase text-muted fw-semibold">Seguimiento</div>
            <h1 className="mb-0 max-w-[12ch] text-[clamp(2rem,8vw,2.7rem)] font-bold leading-tight text-brand">Revisa el estado de tu pedido</h1>
          </div>
          <Link to="/" className="btn btn-brand-outline w-100 sm:w-auto">
            <i className="bi bi-grid me-2" />
            Volver al menú
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="surface-card p-4">
              <h2 className="h5 mb-3">Buscar pedido</h2>
              <label className="form-label">Código</label>
              <input
                className="form-control mb-3"
                value={codigo}
                onChange={(event) => setCodigo(event.target.value.toUpperCase())}
                placeholder="PEPE-123456"
              />
              <div className="small text-muted">
                Si acabas de confirmar un pedido, aquí verás el seguimiento con tu código.
              </div>
            </div>
          </div>

          <div className="min-w-0">
            {!order ? (
              <div className="surface-card p-5 empty-state">
                <div className="fs-2 mb-2">📍</div>
                <p className="fw-semibold mb-2">No encontramos ese pedido</p>
                <p className="text-muted mb-0">
                  Verifica el código o crea un pedido nuevo desde el menú.
                </p>
              </div>
            ) : (
              <div className="surface-card p-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                  <div>
                    <div className="small text-uppercase text-muted fw-semibold">Código</div>
                    <div className="h3 mb-2">{order.codigo}</div>
                    <div className="text-muted">
                      Creado el {new Date(order.createdAt).toLocaleString('es-GT')}
                    </div>
                  </div>
                  <StatusBadge value={order.dynamicStatus || order.status} />
                </div>

                <div className="surface-panel p-3 mb-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    {TIMELINE.map((status, index) => (
                      <div key={status}>
                        <div className={`p-3 rounded-4 border h-100 ${index <= currentStep ? 'bg-white border-success-subtle' : 'bg-light border-light-subtle'}`}>
                          <div className="small text-uppercase fw-semibold text-muted mb-1">{index + 1}</div>
                          <div className={`fw-semibold ${index <= currentStep ? 'text-success' : 'text-muted'}`}>
                            {status.replaceAll('_', ' ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <h2 className="h5 mb-3">Detalle</h2>
                <div className="table-responsive">
                  <table className="table table-app align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="text-center">Cantidad</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.nombre}</td>
                          <td className="text-center">{item.cantidad}</td>
                          <td className="text-end fw-semibold">Q{item.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 d-flex justify-content-end">
                  <div className="surface-panel p-3 w-100 sm:w-auto" style={{ minWidth: 260 }}>
                    <div className="text-sm text-[var(--app-text-muted)]" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem 1rem' }}>
                      <span>Subtotal</span>
                      <span>Q{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 text-sm text-[var(--app-text-muted)]" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem 1rem' }}>
                      <span>Servicio</span>
                      <span>Q{order.serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 text-[1.05rem] font-bold text-[var(--app-text)]" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem 1rem' }}>
                      <span>Total</span>
                      <span>Q{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
