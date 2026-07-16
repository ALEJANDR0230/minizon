import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AdminRoute from './components/auth/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/auth/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminAdvisorPage from './pages/admin/AdminAdvisorPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="iniciar-sesion" element={<LoginPage />} />
            <Route element={<AdminRoute />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="productos" element={<AdminProductsPage />} />
                <Route path="categorias" element={<AdminCategoriesPage />} />
                <Route path="pedidos" element={<AdminOrdersPage />} />
                <Route path="clientes-moviles" element={<AdminUsersPage />} />
                <Route path="resenas" element={<AdminReviewsPage />} />
                <Route path="reportes" element={<AdminReportsPage />} />
                <Route path="asesor-ia" element={<AdminAdvisorPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
