import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerUi } from '../../context/CustomerUiContext';

export default function ClientCheckout() {
  const navigate = useNavigate();
  const {
    cartItems,
    subtotal,
    serviceFee,
    total,
    updateCartItem,
    placeOrder,
  } = useCustomerUi();

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    referencia: '',
    metodo: 'efectivo',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.cantidad, 0),
    [cartItems]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (cartItems.length === 0) {
      setError('Agrega al menos un producto antes de confirmar.');
      return;
    }

    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError('Nombre y teléfono son obligatorios.');
      return;
    }

    setSubmitting(true);
    try {
      const order = placeOrder(form);
      navigate(`/cliente/seguimiento?codigo=${order.codigo}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 py-4">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <div className="min-w-0">
            <div className="small text-uppercase text-muted fw-semibold">Checkout</div>
            <h1 className="h2 text-brand fw-bold mb-0">Confirma tu pedido</h1>
          </div>
          <Link to="/" className="btn btn-brand-outline w-100 sm:w-auto">
            <i className="bi bi-arrow-left me-2" />
            Seguir comprando
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.9fr)]">
          <div className="min-w-0">
            <div className="surface-card p-4">
              <h2 className="h4 mb-3">Productos seleccionados</h2>
              {cartItems.length === 0 ? (
                <div className="empty-state">
                  <div className="fs-2 mb-2">🛍️</div>
                  <p className="fw-semibold mb-2">Tu carrito está vacío</p>
                  <p className="text-muted mb-3">Vuelve al menú para elegir algo del catálogo.</p>
                  <Link to="/" className="btn btn-brand">Ir al menú</Link>
                </div>
              ) : (
                <div className="d-grid gap-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="surface-panel p-3">
                      <div className="d-flex flex-column justify-content-between gap-4 sm:flex-row sm:align-items-start">
                        <div className="d-flex min-w-0 gap-3 align-items-center">
                          <div className="product-icon">{item.icono}</div>
                          <div className="min-w-0">
                            <div className="fw-semibold">{item.nombre}</div>
                            <div className="text-muted small">{item.descripcion}</div>
                            <div className="small text-muted mt-1">Q{item.precio.toFixed(2)} cada uno</div>
                          </div>
                        </div>
                        <div className="text-end sm:shrink-0">
                          <div className="fw-bold text-brand">Q{item.subtotal.toFixed(2)}</div>
                          <div className="btn-group mt-2" role="group">
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => updateCartItem(item.id, item.cantidad - 1)}>
                              <i className="bi bi-dash-lg" />
                            </button>
                            <span className="btn btn-sm btn-light disabled">{item.cantidad}</span>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => updateCartItem(item.id, item.cantidad + 1)}>
                              <i className="bi bi-plus-lg" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="surface-card p-4 checkout-summary">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div className="small text-uppercase text-muted fw-semibold">Datos del pedido</div>
                  <h2 className="h4 mb-0">Entrega y pago</h2>
                </div>
                <div className="product-icon">📦</div>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit} className="d-grid gap-3">
                <div>
                  <label className="form-label">Nombre</label>
                  <input
                    className="form-control"
                    value={form.nombre}
                    onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="form-label">Teléfono</label>
                  <input
                    className="form-control"
                    value={form.telefono}
                    onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))}
                    placeholder="502..."
                  />
                </div>
                <div>
                  <label className="form-label">Referencia o notas</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    value={form.referencia}
                    onChange={(event) => setForm((current) => ({ ...current, referencia: event.target.value }))}
                    placeholder="Ej. mesa de terraza, para llevar, poca salsa..."
                  />
                </div>
                <div>
                  <label className="form-label">Método de pago</label>
                  <select
                    className="form-select"
                    value={form.metodo}
                    onChange={(event) => setForm((current) => ({ ...current, metodo: event.target.value }))}
                  >
                    <option value="efectivo">Efectivo al recoger</option>
                    <option value="tarjeta">Tarjeta en local</option>
                  </select>
                </div>

                <div className="surface-panel p-3">
                  <div className="text-sm text-[var(--app-text-muted)]" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem 1rem' }}>
                    <span>Productos</span>
                    <span>{itemCount}</span>
                  </div>
                  <div className="mt-2 text-sm text-[var(--app-text-muted)]" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem 1rem' }}>
                    <span>Subtotal</span>
                    <span>Q{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 mb-3 text-sm text-[var(--app-text-muted)]" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem 1rem' }}>
                    <span>Servicio</span>
                    <span>Q{serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="text-[1.05rem] font-bold text-[var(--app-text)]" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem 1rem' }}>
                    <span>Total</span>
                    <span>Q{total.toFixed(2)}</span>
                  </div>
                </div>

                <button type="submit" className="btn btn-brand btn-lg" disabled={submitting || cartItems.length === 0}>
                  {submitting ? 'Confirmando...' : 'Confirmar pedido'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
