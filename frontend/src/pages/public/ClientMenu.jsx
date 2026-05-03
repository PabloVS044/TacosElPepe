import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerUi } from '../../context/CustomerUiContext';

export default function ClientMenu() {
  const {
    catalog,
    cartItems,
    subtotal,
    serviceFee,
    total,
    addToCart,
    updateCartItem,
    clearCart,
  } = useCustomerUi();

  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const categorias = useMemo(
    () => ['Todos', ...new Set(catalog.map((item) => item.categoria))],
    [catalog]
  );

  const visibleProducts = useMemo(() => (
    selectedCategory === 'Todos'
      ? catalog
      : catalog.filter((item) => item.categoria === selectedCategory)
  ), [catalog, selectedCategory]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.cantidad, 0),
    [cartItems]
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fcf9f8_0%,#f5efed_100%)]">
      <header className="sticky top-0 z-30 border-b border-[var(--app-border)] bg-white/95 backdrop-blur">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)] text-xl text-white shadow-[var(--shadow-soft)]">
              🌮
            </span>
            <div>
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
                Pedido autoservicio
              </div>
              <div className="text-xl font-extrabold text-[var(--brand)]">Tacos El Pepe</div>
            </div>
          </div>

          <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
            <div className="inline-flex min-h-[3rem] items-center rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-semibold text-[var(--app-text)] shadow-[var(--shadow-soft)]">
              {cartCount} artículos
            </div>
            <Link to="/login" className="btn btn-brand-outline w-full sm:w-auto">
              <i className="bi bi-person-lock me-2" />
              Empleados
            </Link>
            <Link to="/cliente/checkout" className="btn btn-brand w-full sm:w-auto">
              <i className="bi bi-bag-check me-2" />
              Continuar
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-4 lg:py-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
              Selecciona tu pedido
            </div>
            <h1 className="mt-1 text-[clamp(2rem,7vw,3.4rem)] font-extrabold leading-[0.95] text-[var(--brand)]">
              Elige productos y revisa tu carrito
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-text-muted)]">
              Toca un producto para agregarlo. Usa el panel derecho para ajustar cantidades antes de confirmar.
            </p>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="min-w-0">
            <div className="surface-card p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="small text-uppercase text-muted fw-semibold">Categorías</div>
                  <div className="text-sm text-[var(--app-text-muted)]">Filtro rápido de productos</div>
                </div>
                <span className="badge rounded-pill soft-secondary px-3 py-2">
                  {visibleProducts.length} productos
                </span>
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
                          'inline-flex min-h-[3.25rem] items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition',
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

            <div className="mt-5">
              {!visibleProducts.length ? (
                <div className="surface-card p-4 sm:p-5">
                  <div className="empty-state">
                    <div className="fs-2 mb-2">🍽️</div>
                    <p className="mb-2 fw-semibold">No hay productos en esta categoría</p>
                    <p className="mb-0 text-muted">Prueba con otra opción del menú.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {visibleProducts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="group flex min-h-[15rem] flex-col justify-between rounded-[1.45rem] border border-[var(--app-border)] bg-white p-4 text-left shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] active:scale-[0.99]"
                      onClick={() => addToCart(item)}
                    >
                      <div>
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--app-surface-soft)] text-3xl">
                            {item.icono}
                          </span>
                          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--app-text)]">
                            {item.categoria}
                          </span>
                        </div>
                        <div className="text-[1.18rem] font-bold leading-[1.1] text-[var(--app-text)]">
                          {item.nombre}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                          {item.descripcion}
                        </p>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                            Precio
                          </div>
                          <div className="mt-1 text-[1.7rem] font-extrabold leading-none text-[var(--brand)]">
                            Q{item.precio.toFixed(2)}
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

          <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
            <div className="surface-card p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="small text-uppercase text-muted fw-semibold">Tu pedido</div>
                  <h2 className="h4 mb-0">{cartCount} artículos</h2>
                </div>
                {cartItems.length > 0 && (
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearCart}>
                    Vaciar
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="empty-state">
                  <div className="fs-2 mb-2">🛒</div>
                  <p className="mb-2 fw-semibold">Tu carrito está vacío</p>
                  <p className="mb-0 text-muted">Agrega productos desde el catálogo.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div key={item.id} className="surface-panel px-3 py-3">
                        <div className="d-flex justify-content-between align-items-start gap-3">
                          <div className="min-w-0">
                            <div className="fw-semibold">{item.nombre}</div>
                            <div className="small text-muted mt-1">Q{item.precio.toFixed(2)} c/u</div>
                          </div>
                          <div className="fw-semibold shrink-0">Q{item.subtotal.toFixed(2)}</div>
                        </div>

                        <div className="mt-3 d-flex flex-wrap align-items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-white text-lg font-bold text-[var(--app-text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                            onClick={() => updateCartItem(item.id, item.cantidad - 1)}
                          >
                            -
                          </button>
                          <div className="min-w-[3.25rem] rounded-xl border border-[var(--app-border)] bg-white px-4 py-2 text-center fw-semibold">
                            {item.cantidad}
                          </div>
                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-white text-lg font-bold text-[var(--app-text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                            onClick={() => updateCartItem(item.id, item.cantidad + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[1.35rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
                    <div className="text-sm text-[var(--app-text-muted)]" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem 1rem' }}>
                      <span>Subtotal</span>
                      <span>Q{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 text-sm text-[var(--app-text-muted)]" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem 1rem' }}>
                      <span>Servicio</span>
                      <span>Q{serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="mt-3 text-[1.05rem] font-bold text-[var(--app-text)]" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem 1rem' }}>
                      <span>Total</span>
                      <span>Q{total.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}

              <Link
                to="/cliente/checkout"
                className={`btn btn-brand btn-lg mt-4 w-100 ${cartItems.length === 0 ? 'disabled pointer-events-none opacity-60' : ''}`}
              >
                Continuar al checkout
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
