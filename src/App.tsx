import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import LoginPage from "./pages/LoginPage";

const EmployeeLayout = lazy(() => import("./layouts/EmployeeLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const EmployeeSchedule = lazy(() => import("./pages/employee/EmployeeSchedule"));
const EmployeeAnnouncements = lazy(() => import("./pages/employee/EmployeeAnnouncements"));
const EmployeeTimeOff = lazy(() => import("./pages/employee/EmployeeTimeOff"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEmployees = lazy(() => import("./pages/admin/AdminEmployees"));
const AdminPosts = lazy(() => import("./pages/admin/AdminPosts"));
const AdminShifts = lazy(() => import("./pages/admin/AdminShifts"));
const AdminSchedule = lazy(() => import("./pages/admin/AdminSchedule"));
const AdminTimeOff = lazy(() => import("./pages/admin/AdminTimeOff"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));
const AdminFinanceiro = lazy(() => import("./pages/admin/AdminFinanceiro"));
const AdminPostoDashboard = lazy(() => import("./pages/admin/AdminPostoDashboard"));
const AdminRelatorios = lazy(() => import("./pages/admin/AdminRelatorios"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  if (user.role === 'admin') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/funcionarios" element={<AdminLayout><AdminEmployees /></AdminLayout>} />
          <Route path="/admin/postos" element={<AdminLayout><AdminPosts /></AdminLayout>} />
          <Route path="/admin/turnos" element={<AdminLayout><AdminShifts /></AdminLayout>} />
          <Route path="/admin/escala" element={<AdminLayout><AdminSchedule /></AdminLayout>} />
          <Route path="/admin/folgas" element={<AdminLayout><AdminTimeOff /></AdminLayout>} />
          <Route path="/admin/avisos" element={<AdminLayout><AdminAnnouncements /></AdminLayout>} />
          <Route path="/admin/financeiro" element={<AdminLayout><AdminFinanceiro /></AdminLayout>} />
          <Route path="/admin/posto/:postoId" element={<AdminLayout><AdminPostoDashboard /></AdminLayout>} />
          <Route path="/admin/relatorios" element={<AdminLayout><AdminRelatorios /></AdminLayout>} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/app" element={<EmployeeLayout><EmployeeDashboard /></EmployeeLayout>} />
        <Route path="/app/escala" element={<EmployeeLayout><EmployeeSchedule /></EmployeeLayout>} />
        <Route path="/app/avisos" element={<EmployeeLayout><EmployeeAnnouncements /></EmployeeLayout>} />
        <Route path="/app/folgas" element={<EmployeeLayout><EmployeeTimeOff /></EmployeeLayout>} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
