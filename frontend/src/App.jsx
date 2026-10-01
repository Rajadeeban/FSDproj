import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/route/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RenewableEnergy from './pages/RenewableEnergy';
import HydrogenProduction from './pages/HydrogenProduction';
import EnergyOptimization from './pages/EnergyOptimization';
import StorageManagement from './pages/StorageManagement';
import Simulation from './pages/Simulation';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Admin from './pages/Admin';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ style: { fontSize: 13, borderRadius: 10 } }} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="renewable" element={<RenewableEnergy />} />
              <Route path="hydrogen" element={<HydrogenProduction />} />
              <Route path="optimization" element={<EnergyOptimization />} />
              <Route path="storage" element={<StorageManagement />} />
              <Route path="simulation" element={<Simulation />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="alerts" element={<Alerts />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute adminOnly>
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
