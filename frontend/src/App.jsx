import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductosList from './pages/productos/ProductosList';
import ProductoForm from './pages/productos/ProductoForm';
import InsumosList from './pages/insumos/InsumosList';
import InsumoForm from './pages/insumos/InsumoForm';
import ReporteVentas from './pages/reportes/ReporteVentas';
import ReporteDiario from './pages/reportes/ReporteDiario';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/productos" element={<ProtectedRoute><ProductosList /></ProtectedRoute>} />
          <Route path="/productos/nuevo" element={<ProtectedRoute><ProductoForm /></ProtectedRoute>} />
          <Route path="/productos/:id/editar" element={<ProtectedRoute><ProductoForm /></ProtectedRoute>} />
          <Route path="/insumos" element={<ProtectedRoute><InsumosList /></ProtectedRoute>} />
          <Route path="/insumos/nuevo" element={<ProtectedRoute><InsumoForm /></ProtectedRoute>} />
          <Route path="/insumos/:id/editar" element={<ProtectedRoute><InsumoForm /></ProtectedRoute>} />
          <Route path="/reportes/ventas" element={<ProtectedRoute><ReporteVentas /></ProtectedRoute>} />
          <Route path="/reportes/diario" element={<ProtectedRoute><ReporteDiario /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
