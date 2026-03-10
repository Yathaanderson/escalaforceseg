import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import LoginPage from "./pages/LoginPage";
import EmployeeLayout from "./layouts/EmployeeLayout";
import AdminLayout from "./layouts/AdminLayout";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeSchedule from "./pages/employee/EmployeeSchedule";
import EmployeeAnnouncements from "./pages/employee/EmployeeAnnouncements";
import EmployeeTimeOff from "./pages/employee/EmployeeTimeOff";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminShifts from "./pages/admin/AdminShifts";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminTimeOff from "./pages/admin/AdminTimeOff";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminFinanceiro from "./pages/admin/AdminFinanceiro";
import NotFound from "./pages/NotFound";

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
      <Routes>
        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/funcionarios" element={<AdminLayout><AdminEmployees /></AdminLayout>} />
        <Route path="/admin/postos" element={<AdminLayout><AdminPosts /></AdminLayout>} />
        <Route path="/admin/turnos" element={<AdminLayout><AdminShifts /></AdminLayout>} />
        <Route path="/admin/escala" element={<AdminLayout><AdminSchedule /></AdminLayout>} />
        <Route path="/admin/folgas" element={<AdminLayout><AdminTimeOff /></AdminLayout>} />
        <Route path="/admin/avisos" element={<AdminLayout><AdminAnnouncements /></AdminLayout>} />
        <Route path="/admin/financeiro" element={<AdminLayout><AdminFinanceiro /></AdminLayout>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/app" element={<EmployeeLayout><EmployeeDashboard /></EmployeeLayout>} />
      <Route path="/app/escala" element={<EmployeeLayout><EmployeeSchedule /></EmployeeLayout>} />
      <Route path="/app/avisos" element={<EmployeeLayout><EmployeeAnnouncements /></EmployeeLayout>} />
      <Route path="/app/folgas" element={<EmployeeLayout><EmployeeTimeOff /></EmployeeLayout>} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
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
