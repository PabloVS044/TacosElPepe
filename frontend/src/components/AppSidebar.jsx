import { memo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHomePath } from '../utils/roleHome';

function matchesCrudSection(pathname, basePath) {
  const escapedBasePath = basePath.replace('/', '\\/');
  const editPattern = new RegExp(`^${escapedBasePath}\\/[^/]+\\/editar$`);

  return (
    pathname === basePath
    || pathname === `${basePath}/nuevo`
    || editPattern.test(pathname)
  );
}

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: 'grid-1x2',
    roles: ['admin', 'cajero'],
    match: (pathname) => pathname === '/dashboard',
  },
  {
    to: '/pos',
    label: 'POS',
    icon: 'display',
    roles: ['admin', 'cajero'],
    match: (pathname) => pathname === '/pos',
  },
  {
    to: '/pedidos',
    label: 'Pedidos',
    icon: 'receipt',
    roles: ['admin', 'cajero', 'cocinero'],
    match: (pathname) => pathname === '/pedidos',
  },
  {
    to: '/productos',
    label: 'Productos',
    icon: 'cup-hot',
    roles: ['admin'],
    match: (pathname) => matchesCrudSection(pathname, '/productos'),
  },
  {
    to: '/insumos',
    label: 'Insumos',
    icon: 'box-seam',
    roles: ['admin'],
    match: (pathname) => matchesCrudSection(pathname, '/insumos'),
  },
  {
    to: '/insumos/reabastecer',
    label: 'Reabastecer',
    icon: 'cart-plus',
    roles: ['admin'],
    match: (pathname) => pathname.startsWith('/insumos/reabastecer'),
  },
  {
    to: '/reportes',
    label: 'Reportes',
    icon: 'bar-chart',
    roles: ['admin', 'cajero'],
    match: (pathname) => pathname.startsWith('/reportes'),
  },
  {
    to: '/analitica',
    label: 'Analítica SQL',
    icon: 'diagram-3',
    roles: ['admin', 'cajero'],
    match: (pathname) => pathname === '/analitica',
  },
];

function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.rol));

  const handleClientPortal = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  }, [logout, navigate]);

  return (
    <aside className="sticky top-0 z-30 flex h-auto w-full flex-col border-b border-[var(--app-border)] bg-white/92 p-5 backdrop-blur lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:h-screen lg:w-[280px] lg:overflow-y-auto lg:border-b-0 lg:shadow-[inset_-1px_0_0_var(--app-border)]">
      <div className="mb-4 border-b border-[var(--app-border)] pb-4">
        <Link to={getRoleHomePath(user?.rol)} className="flex items-center gap-4 no-underline">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)] text-xl text-white shadow-[var(--shadow-soft)]">🌮</span>
          <div>
            <div className="font-semibold text-[var(--app-text)]">Tacos El Pepe</div>
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-muted)]">Operación</div>
          </div>
        </Link>
      </div>

      <div className="grid gap-2 lg:flex-1">
        {visibleItems.map((item) => {
          const active = item.match(location.pathname);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                'flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold no-underline transition',
                active
                  ? 'bg-[var(--brand)] text-white shadow-[0_10px_24px_rgba(114,14,16,0.18)]'
                  : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-soft)] hover:text-[var(--brand)]',
              ].join(' ')}
            >
              <i className={`bi bi-${item.icon}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 border-t border-[var(--app-border)] pt-4">
        <button
          type="button"
          className="btn btn-brand-outline mb-2 w-100"
          onClick={handleClientPortal}
        >
          <i className="bi bi-shop me-2" />
          Portal Cliente
        </button>
        <button type="button" className="btn btn-outline-secondary w-100" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-2" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default memo(AppSidebar);
