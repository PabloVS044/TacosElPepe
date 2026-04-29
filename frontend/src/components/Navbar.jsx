import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';

export default function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!user) return null;

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } finally {
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">🌮 Tacos El Pepe</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className={`nav-link ${pathname.startsWith('/productos') ? 'active' : ''}`} to="/productos">Productos</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${pathname.startsWith('/insumos') ? 'active' : ''}`} to="/insumos">Insumos</Link>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Reportes</a>
              <ul className="dropdown-menu">
                <li><Link className="dropdown-item" to="/reportes/ventas">Productos más vendidos</Link></li>
                <li><Link className="dropdown-item" to="/reportes/diario">Ventas diarias</Link></li>
              </ul>
            </li>
          </ul>
          <div className="d-flex align-items-center gap-2">
            <span className="text-light small">
              <i className="bi bi-person-circle me-1" />
              {user.nombre} {user.apellido}
              <span className="badge bg-secondary ms-2">{user.rol}</span>
            </span>
            <button className="btn btn-sm btn-outline-light" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
