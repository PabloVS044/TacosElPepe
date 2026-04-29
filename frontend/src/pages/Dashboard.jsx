import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h4 className="mb-1">Bienvenido, {user?.nombre} {user?.apellido}</h4>
        <p className="text-muted mb-4">Panel de administración — Tacos El Pepe</p>
        <div className="row g-4">
          {[
            { emoji: '🍽️', title: 'Productos', desc: 'Gestiona el menú: tacos, bebidas y combos.', to: '/productos' },
            { emoji: '📦', title: 'Insumos', desc: 'Controla el inventario de ingredientes.', to: '/insumos' },
            { emoji: '📊', title: 'Reportes', desc: 'Consulta ventas y estadísticas del negocio.', to: '/reportes/ventas' },
          ].map(c => (
            <div className="col-md-4" key={c.title}>
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="display-4 mb-3">{c.emoji}</div>
                  <h5 className="card-title">{c.title}</h5>
                  <p className="card-text text-muted">{c.desc}</p>
                  <Link to={c.to} className="btn btn-dark">Ver {c.title.toLowerCase()}</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
