import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import { getRoleHomePath } from '../utils/roleHome';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <LoadingScreen message="Comprobando sesión..." />;
  if (user) return <Navigate to={getRoleHomePath(user.rol)} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const authUser = await login({ email, password });
      navigate(getRoleHomePath(authUser.rol));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center py-4 bg-app-surface">
      <div className="container">
        <div className="row justify-content-center align-items-center g-4">
          <div className="col-lg-6">
            <div className="hero-panel p-4 p-lg-5">
              <div className="small text-uppercase fw-semibold text-muted mb-2">
                Acceso del personal
              </div>
              <h1 className="display-5 fw-bold text-brand mb-3">Tacos El Pepe</h1>
              <p className="lead text-muted mb-4">
                Una sola entrada para cajero, cocina y administración. La operación se mantiene
                sobria, rápida y lista para usarse incluso en terminal táctil.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge rounded-pill text-bg-light border px-3 py-2">POS simple</span>
                <span className="badge rounded-pill text-bg-light border px-3 py-2">Pedidos activos</span>
                <span className="badge rounded-pill text-bg-light border px-3 py-2">Reportes SQL</span>
              </div>
            </div>
          </div>

          <div className="col-md-8 col-lg-5">
            <div className="surface-card p-4 p-lg-5">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <div className="small text-uppercase text-muted fw-semibold">Iniciar sesión</div>
                  <h2 className="h2 mb-0">Panel interno</h2>
                </div>
                <div className="product-icon">🔐</div>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Correo electrónico</label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jose.perez@tacospepe.gt"
                    required
                    autoFocus
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-brand btn-lg w-100 mb-3" disabled={submitting}>
                  {submitting ? 'Entrando...' : 'Acceder al sistema'}
                </button>
                <Link to="/" className="btn btn-brand-outline btn-lg w-100">
                  Ir al portal de clientes
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
