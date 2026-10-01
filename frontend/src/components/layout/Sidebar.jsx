import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Sun, Factory, SlidersHorizontal, Battery,
  FlaskConical, LineChart, Bell, ShieldCheck, Leaf, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/renewable', label: 'Renewable Energy', icon: Sun },
  { to: '/hydrogen', label: 'Hydrogen Production', icon: Factory },
  { to: '/optimization', label: 'Energy Optimization', icon: SlidersHorizontal },
  { to: '/storage', label: 'Storage Management', icon: Battery },
  { to: '/simulation', label: 'Simulation', icon: FlaskConical },
  { to: '/analytics', label: 'Forecasting & Analytics', icon: LineChart },
  { to: '/alerts', label: 'Alerts', icon: Bell },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 shrink-0 bg-white dark:bg-ink-900 border-r border-ink-100 dark:border-ink-800 z-40 transform transition-transform duration-200 flex flex-col
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-ink-100 dark:border-ink-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Leaf size={17} className="text-white" />
            </div>
            <span className="font-bold text-ink-900 dark:text-white tracking-tight">GreenH2</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-ink-400">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                  : 'text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'}`
              }
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}

          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                  : 'text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'}`
              }
            >
              <ShieldCheck size={18} strokeWidth={2} />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-ink-100 dark:border-ink-800">
          <div className="text-xs text-ink-400">GreenH2 Platform v1.0</div>
          <div className="text-xs text-ink-400">Rule-based optimization engine</div>
        </div>
      </aside>
    </>
  );
}
