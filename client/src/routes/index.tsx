import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicLayout, DashboardLayout } from '../layouts';
import {
  LoginPage,
  HomePage,
  ServicesPage,
  PublicAppointmentPage,
  ContactPage,
  AdminDashboard,
  PatientsPage,
  AppointmentsPage,
  DoctorOverviewPage,
  ManageServicesPage,
  MyAppointmentsPage,
  PatientHistoryPage,
  UsersPage,
  TreatmentHistoryPage,
  InvoicesPage,
  InvoiceDetailsPage,
} from '../pages';
import { useAuth } from '../context/AuthContext';
const NotFoundPage = () => <div>404 Not Found</div>;

const DashboardHomePage = () => {
  const { user } = useAuth();

  if (user?.role === 'doctor') {
    return <DoctorOverviewPage />;
  }

  return <AdminDashboard />;
};

// Redirect component for logged-in users
const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getRoleRoute = (role: string) => {
    switch (role) {
      case 'admin':
        return '/dashboard/users';
      case 'doctor':
        return '/dashboard';
      case 'staff':
        return '/dashboard/patients';
      default:
        return '/dashboard';
    }
  };

  return <Navigate to={getRoleRoute(user.role)} replace />;
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <HomePage />
            </PublicLayout>
          }
        />

        <Route
          path="/login"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />

        <Route
          path="/services"
          element={
            <PublicLayout>
              <ServicesPage />
            </PublicLayout>
          }
        />

        <Route
          path="/book-appointment"
          element={
            <PublicLayout>
              <PublicAppointmentPage />
            </PublicLayout>
          }
        />

        <Route
          path="/contact"
          element={
            <PublicLayout>
              <ContactPage />
            </PublicLayout>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardHomePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/patients"
          element={
            <ProtectedRoute requiredRole={['admin', 'staff']}>
              <DashboardLayout>
                <PatientsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/services"
          element={
            <ProtectedRoute requiredRole={['admin', 'staff']}>
              <DashboardLayout>
                <ManageServicesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/appointments"
          element={
            <ProtectedRoute requiredRole={['admin', 'staff']}>
              <DashboardLayout>
                <AppointmentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/my-appointments"
          element={
            <ProtectedRoute requiredRole={['doctor']}>
              <DashboardLayout>
                <MyAppointmentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/patient-history"
          element={
            <ProtectedRoute requiredRole={['doctor']}>
              <DashboardLayout>
                <PatientHistoryPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/users"
          element={
            <ProtectedRoute requiredRole={['admin']}>
              <DashboardLayout>
                <UsersPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/treatment-history"
          element={
            <ProtectedRoute requiredRole={['admin', 'staff', 'doctor']}>
              <DashboardLayout>
                <TreatmentHistoryPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/invoices"
          element={
            <ProtectedRoute requiredRole={['admin', 'staff']}>
              <DashboardLayout>
                <InvoicesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/invoices/:invoiceId"
          element={
            <ProtectedRoute requiredRole={['admin', 'staff']}>
              <DashboardLayout>
                <InvoiceDetailsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirect /dashboard-redirect based on role */}
        <Route path="/dashboard-redirect" element={<RoleBasedRedirect />} />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
