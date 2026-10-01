import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const titles = {
  '/': 'Dashboard',
  '/renewable': 'Renewable Energy',
  '/hydrogen': 'Hydrogen Production',
  '/optimization': 'Energy Optimization',
  '/storage': 'Storage Management',
  '/simulation': 'Simulation',
  '/analytics': 'Forecasting & Analytics',
  '/alerts': 'Alerts & Recommendations',
  '/admin': 'Admin',
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = titles[location.pathname] || 'GreenH2';

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6 max-w-[1600px] mx-auto animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
