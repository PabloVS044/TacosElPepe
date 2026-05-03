import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import LoadingScreen from '../../components/LoadingScreen';
import { api } from '../../api/api';

const EMPTY = { id_categoria_producto: '', nombre: '', descripcion: '', precio: '', disponible: true };

export default function ProductoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get('/productos/categorias'),
      isEdit ? api.get(`/productos/${id}`) : Promise.resolve(null),
    ])
      .then(([categoriasResponse, productoResponse]) => {
        if (!active) {
          return;
        }

        setCategorias(categoriasResponse.categorias);
        if (productoResponse?.producto) {
          const p = productoResponse.producto;
          setForm({
            id_categoria_producto: String(p.id_categoria_producto),
            nombre: p.nombre,
            descripcion: p.descripcion || '',
            precio: p.precio,
            disponible: p.disponible,
          });
        }
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
  }, [id, isEdit]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/productos/${id}`, form);
      } else {
        await api.post('/productos', form);
      }
      navigate('/productos');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen label={isEdit ? 'Cargando producto...' : 'Cargando formulario...'} />;
  }

  return (
    <AppShell
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      subtitle="Formulario administrativo para el catálogo de venta."
      actions={(
        <Link to="/productos" className="btn btn-outline-secondary">
          Volver
        </Link>
      )}
    >
      <div className="row justify-content-center">
        <div className="col-12 col-xl-8">
          <div className="surface-card p-3 p-lg-4">
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Categoría *</label>
                  <select className="form-select" name="id_categoria_producto" value={form.id_categoria_producto} onChange={handleChange} required>
                    <option value="">Selecciona una categoría</option>
                    {categorias.map((c) => (
                      <option key={c.id_categoria_producto} value={c.id_categoria_producto}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">Nombre *</label>
                  <input className="form-control" name="nombre" value={form.nombre} onChange={handleChange} required />
                </div>

                <div className="col-12">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-control" name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} />
                </div>

                <div className="col-12 col-lg-6">
                  <label className="form-label">Precio (Q) *</label>
                  <input className="form-control" type="number" name="precio" value={form.precio} onChange={handleChange} min="0" step="0.01" required />
                </div>

                <div className="col-12 col-lg-6 d-flex align-items-end">
                  <div className="form-check form-switch fs-5">
                    <input className="form-check-input" type="checkbox" id="disponible" name="disponible" checked={form.disponible} onChange={handleChange} />
                    <label className="form-check-label" htmlFor="disponible">Producto disponible</label>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-brand" disabled={saving}>
                  {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
                </button>
                <Link to="/productos" className="btn btn-outline-secondary">Cancelar</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
