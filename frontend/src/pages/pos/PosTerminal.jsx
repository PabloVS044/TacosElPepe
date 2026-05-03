import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const GENERAL_CUSTOMER = {
  id: 'general',
  nombre: 'Cliente general',
  telefono: 'Mostrador',
};

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo', icon: 'cash-coin' },
  { value: 'tarjeta', label: 'Tarjeta', icon: 'credit-card-2-front' },
  { value: 'transferencia', label: 'Transferencia', icon: 'bank' },
];

const PAYMENT_HINTS = {
  efectivo: 'Cobro inmediato en caja',
  tarjeta: 'Pago con terminal',
  transferencia: 'Transferencia validada',
};

const DESCRIPTION_CLAMP = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

function money(value) {
  return `Q${Number(value || 0).toFixed(2)}`;
}

export default function PosTerminal() {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([GENERAL_CUSTOMER]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedCustomer, setSelectedCustomer] = useState(GENERAL_CUSTOMER);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [notes, setNotes] = useState('');
  const [ticketSent, setTicketSent] = useState('');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    let active = true;

    Promise.all([api.get('/productos'), api.get('/consultas/subqueries/clientes-con-pagos')])
      .then(([productResponse, clientResponse]) => {
        if (!active) {
          return;
        }

        const onlyAvailable = productResponse.productos.filter((producto) => producto.disponible);
        setProductos(onlyAvailable);
        setCategorias(['Todos', ...new Set(onlyAvailable.map((producto) => producto.categoria))]);
        const clientOptions = [
          GENERAL_CUSTOMER,
          ...clientResponse.datos.map((client) => ({
            id: client.id_cliente,
            nombre: client.cliente,
            telefono: client.telefono || client.email || 'Registrado',
          })),
        ];
        setClientes(clientOptions);
        setSelectedCustomer(clientOptions[0]);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return productos.filter((producto) => {
      const matchesCategory = selectedCategory === 'Todos' || producto.categoria === selectedCategory;
      const matchesSearch = !normalizedSearch
        || producto.nombre.toLowerCase().includes(normalizedSearch)
        || producto.descripcion?.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [productos, search, selectedCategory]);

  const summary = useMemo(() => {
    const items = cart.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cart.reduce((acc, item) => acc + (item.quantity * Number(item.precio)), 0);

    return {
      items,
      subtotal,
    };
  }, [cart]);

  const addProduct = (producto) => {
    setCart((current) => {
      const index = current.findIndex((item) => item.id_producto === producto.id_producto);

      if (index >= 0) {
        return current.map((item, itemIndex) => (
          itemIndex === index ? { ...item, quantity: item.quantity + 1 } : item
        ));
      }

      return [...current, { ...producto, quantity: 1 }];
    });
    setTicketSent('');
  };

  const updateLine = (idProducto, nextQuantity) => {
    setCart((current) => current
      .map((item) => (item.id_producto === idProducto ? { ...item, quantity: nextQuantity } : item))
      .filter((item) => item.quantity > 0));
    setTicketSent('');
  };

  const clearTicket = () => {
    setCart([]);
    setNotes('');
    setPaymentMethod('efectivo');
    setTicketSent('');
  };

  const handleSimulatedSubmit = () => {
    if (!cart.length) {
      setTicketSent('Agrega al menos un producto antes de enviar el pedido.');
      return;
    }

    const orderCode = `MOST-${String(Date.now()).slice(-6)}`;
    setTicketSent(`Pedido ${orderCode} listo para integrar con el endpoint de creacion de pedidos.`);
  };

  if (loading) {
    return <LoadingScreen label="Cargando terminal POS..." />;
  }

  return (
    <AppShell
      title="Terminal POS"
      subtitle="Pantalla simplificada para cajero. Botones grandes y flujo rapido para mostrador."
      actions={(
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex min-h-[3.5rem] items-center justify-center rounded-2xl border border-[var(--app-border-strong)] bg-white px-5 text-sm font-semibold text-[var(--app-text)] shadow-[var(--shadow-soft)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            onClick={clearTicket}
          >
            Limpiar ticket
          </button>
          <button
            type="button"
            className="inline-flex min-h-[3.5rem] items-center justify-center rounded-2xl bg-[var(--brand)] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(114,14,16,0.22)] transition hover:bg-[var(--brand-dark)]"
            onClick={handleSimulatedSubmit}
          >
            Confirmar pedido
          </button>
        </div>
      )}
    >
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_24rem] 2xl:grid-cols-[minmax(0,1.5fr)_26rem]">
        <section className="min-w-0 space-y-4">
          <div className="surface-card p-4 sm:p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
              <div className="min-w-0">
                <div className="mb-2 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
                  Buscar producto
                </div>
                <input
                  className="form-control form-control-lg"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tacos, bebida, combo..."
                />

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="surface-panel px-3 py-3">
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                      Visibles
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-[var(--brand)]">{filteredProducts.length}</div>
                  </div>
                  <div className="surface-panel px-3 py-3">
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                      En ticket
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-[var(--brand)]">{summary.items}</div>
                  </div>
                  <div className="surface-panel px-3 py-3">
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                      Total
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-[var(--brand)]">{money(summary.subtotal)}</div>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
                    Categoria
                  </div>
                  <div className="text-sm text-[var(--app-text-muted)]">Filtro rapido</div>
                </div>
                <div className="-mx-1 overflow-x-auto pb-1">
                  <div className="flex min-w-max gap-2 px-1">
                    {categorias.map((categoria) => {
                      const active = selectedCategory === categoria;

                      return (
                        <button
                          key={categoria}
                          type="button"
                          className={[
                            'inline-flex min-h-[3.25rem] items-center justify-center rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition',
                            active
                              ? 'border-[var(--brand)] bg-[var(--brand)] text-white shadow-[0_10px_24px_rgba(114,14,16,0.18)]'
                              : 'border-[var(--app-border)] bg-white text-[var(--app-text)] hover:border-[var(--brand)] hover:text-[var(--brand)]',
                          ].join(' ')}
                          onClick={() => setSelectedCategory(categoria)}
                        >
                          {categoria}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="small text-uppercase text-muted fw-semibold">Catalogo rapido</div>
                <h2 className="h4 mb-0">
                  {selectedCategory === 'Todos' ? 'Todos los productos' : selectedCategory}
                </h2>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge rounded-pill soft-secondary px-3 py-2">
                  {filteredProducts.length} productos
                </span>
                <span className="badge rounded-pill soft-warning px-3 py-2">
                  Tap o click para agregar
                </span>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <EmptyState
                icon="search"
                title="No hay productos para este filtro"
                description="Prueba otra categoria o cambia el texto de busqueda."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {filteredProducts.map((producto) => (
                  <button
                    key={producto.id_producto}
                    type="button"
                    className="group flex min-h-[12rem] flex-col justify-between rounded-[1.35rem] border border-[var(--app-border)] bg-white p-4 text-left shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] active:scale-[0.99]"
                    onClick={() => addProduct(producto)}
                  >
                    <div className="d-flex justify-content-between gap-3 align-items-start">
                      <div className="min-w-0">
                        <div className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                          {producto.categoria}
                        </div>
                        <div className="mb-2 text-[1.2rem] font-bold leading-[1.15] text-[var(--app-text)]">
                          {producto.nombre}
                        </div>
                        <div className="text-sm leading-5 text-[var(--app-text-muted)]" style={DESCRIPTION_CLAMP}>
                          {producto.descripcion || 'Disponible para mostrador.'}
                        </div>
                      </div>
                      <span className="inline-flex min-h-[2.35rem] shrink-0 items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 text-sm font-semibold text-[var(--app-text)]">
                        {money(producto.precio)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <div className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                          Precio
                        </div>
                        <div className="mt-1 text-[1.6rem] font-extrabold leading-none text-[var(--brand)]">
                          {money(producto.precio)}
                        </div>
                      </div>
                      <span className="inline-flex min-h-[3rem] items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 text-sm font-bold text-[var(--brand)] transition group-hover:border-[var(--brand)] group-hover:bg-[var(--brand)] group-hover:text-white">
                        <i className="bi bi-plus-circle" />
                        Agregar
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <div className="space-y-4">
            <div className="surface-card p-4 sm:p-5">
              <div className="mb-4 d-flex justify-content-between align-items-center gap-3">
                <div>
                  <div className="small text-uppercase text-muted fw-semibold">Pedido actual</div>
                  <h2 className="h4 mb-0">{summary.items} articulos</h2>
                </div>
                <div className="rounded-2xl bg-[var(--warning-soft)] px-3 py-2 text-right">
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8a5b00]">Total</div>
                  <div className="text-lg font-extrabold text-[#8a5b00]">{money(summary.subtotal)}</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="surface-panel px-4 py-4">
                  <div className="small text-uppercase text-muted fw-semibold mb-2">Atiende</div>
                  <div className="fw-semibold">{user?.nombre} {user?.apellido}</div>
                  <div className="small text-muted mt-1">Caja activa</div>
                </div>
                <div className="surface-panel px-4 py-4">
                  <div className="small text-uppercase text-muted fw-semibold mb-2">Canal</div>
                  <div className="fw-semibold">Mostrador</div>
                  <div className="small text-muted mt-1">Flujo rapido para atencion presencial</div>
                </div>
              </div>
            </div>

            <div className="surface-card p-4 sm:p-5">
              <div>
                <label className="form-label text-muted small text-uppercase">Cliente</label>
                <select
                  className="form-select form-select-lg"
                  value={selectedCustomer.id}
                  onChange={(event) => {
                    const nextCustomer = clientes.find((client) => String(client.id) === event.target.value);
                    setSelectedCustomer(nextCustomer || GENERAL_CUSTOMER);
                  }}
                >
                  {clientes.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nombre}
                    </option>
                  ))}
                </select>
                <div className="small text-muted mt-2">{selectedCustomer.telefono}</div>
              </div>

              <div className="mt-4">
                <label className="form-label text-muted small text-uppercase">Metodo de pago</label>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {PAYMENT_METHODS.map((method) => {
                    const active = paymentMethod === method.value;

                    return (
                      <button
                        key={method.value}
                        type="button"
                        className={[
                          'w-full rounded-[1.2rem] border px-4 py-4 text-left transition',
                          active
                            ? 'border-[var(--brand)] bg-[var(--brand)] text-white shadow-[0_10px_24px_rgba(114,14,16,0.18)]'
                            : 'border-[var(--app-border)] bg-white text-[var(--app-text)] hover:border-[var(--brand)] hover:text-[var(--brand)]',
                        ].join(' ')}
                        onClick={() => setPaymentMethod(method.value)}
                      >
                        <div className="d-flex justify-content-between align-items-center gap-3">
                          <div className="d-flex align-items-center gap-3 min-w-0">
                            <span
                              className={[
                                'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border',
                                active ? 'border-white/30 bg-white/12 text-white' : 'border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--brand)]',
                              ].join(' ')}
                            >
                              <i className={`bi bi-${method.icon}`} />
                            </span>
                            <div className="min-w-0">
                              <div className="fw-semibold">{method.label}</div>
                              <div className={`small ${active ? 'text-white/75' : 'text-muted'}`}>
                                {PAYMENT_HINTS[method.value]}
                              </div>
                            </div>
                          </div>
                          <span className={`small fw-semibold uppercase ${active ? 'text-white' : 'text-muted'}`}>
                            {active ? 'Activo' : 'Elegir'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <label className="form-label text-muted small text-uppercase">Notas</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Sin cebolla, extra salsa, para llevar..."
                />
              </div>
            </div>

            <div className="surface-card p-4 sm:p-5">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <h3 className="h5 mb-0">Detalle del ticket</h3>
                {cart.length > 0 && (
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearTicket}>
                    Vaciar
                  </button>
                )}
              </div>

              {!cart.length ? (
                <EmptyState
                  icon="cart"
                  title="Ticket vacio"
                  description="Toca un producto del catalogo para agregarlo al pedido."
                />
              ) : (
                <div className="space-y-3 max-h-[24rem] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id_producto} className="surface-panel p-3">
                      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                        <div className="min-w-0">
                          <div className="fw-semibold">{item.nombre}</div>
                          <div className="small text-muted mt-1">{money(item.precio)} c/u</div>
                        </div>
                        <div className="fw-semibold shrink-0">{money(item.quantity * Number(item.precio))}</div>
                      </div>

                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-white text-lg font-bold text-[var(--app-text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                          onClick={() => updateLine(item.id_producto, item.quantity - 1)}
                        >
                          -
                        </button>
                        <div className="min-w-[3.25rem] rounded-xl border border-[var(--app-border)] bg-white px-4 py-2 text-center fw-semibold">
                          {item.quantity}
                        </div>
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-white text-lg font-bold text-[var(--app-text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                          onClick={() => updateLine(item.id_producto, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="ms-auto inline-flex min-h-[2.75rem] items-center rounded-xl px-3 text-sm font-semibold text-[#b3261e] transition hover:bg-[#ffe4e0]"
                          onClick={() => updateLine(item.id_producto, 0)}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {ticketSent && (
              <div className={`alert ${ticketSent.includes('listo') ? 'alert-warning' : 'alert-danger'}`}>
                {ticketSent}
              </div>
            )}

            <div className="surface-card p-4 sm:p-5">
              <div className="small text-uppercase text-muted fw-semibold mb-3">Resumen</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem 1rem' }}>
                <span className="text-muted">Articulos</span>
                <span>{summary.items}</span>
                <span className="fw-semibold">Total</span>
                <span className="display-6 fw-semibold">{money(summary.subtotal)}</span>
              </div>
              <div className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">
                Flujo listo para conectar la creacion real del pedido en backend.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
