import { useEffect, useState } from 'react';
import { Bell, RefreshCw, Check, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { alertsApi } from '../api/endpoints';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const severityIcon = { CRITICAL: AlertOctagon, WARNING: AlertTriangle, INFO: Info };
const severityVariant = { CRITICAL: 'critical', WARNING: 'warning', INFO: 'info' };

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('active');

  const load = async () => {
    setLoading(true);
    try {
      const res = await alertsApi.list(filter === 'all' ? undefined : filter === 'active' ? false : true);
      setAlerts(res.data.data);
    } catch (err) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await alertsApi.refresh();
      if (res.data.data.length > 0) {
        toast.success(`${res.data.data.length} new alert(s) detected`);
      } else {
        toast.success('No new alerts - system conditions are stable');
      }
      load();
    } catch (err) {
      toast.error('Failed to refresh alerts');
    } finally {
      setRefreshing(false);
    }
  };

  const resolve = async (id) => {
    try {
      await alertsApi.resolve(id);
      toast.success('Alert resolved');
      load();
    } catch (err) {
      toast.error('Failed to resolve alert');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 bg-ink-100 dark:bg-ink-800 rounded-lg p-1">
            {[['active', 'Active'], ['resolved', 'Resolved'], ['all', 'All']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === val ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-white shadow-sm' : 'text-ink-500'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={refresh} disabled={refreshing} className="btn-secondary">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Check for new alerts
          </button>
        </div>
      </Card>

      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="card"><div className="skeleton h-5 w-full" /></div>)
        ) : alerts.length === 0 ? (
          <div className="text-center py-16 text-ink-400">
            <Bell size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No {filter !== 'all' ? filter : ''} alerts to show.</p>
          </div>
        ) : (
          alerts.map((a) => {
            const Icon = severityIcon[a.severity] || Info;
            return (
              <div key={a.id} className="card flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Icon size={18} className={`mt-0.5 shrink-0 ${a.severity === 'CRITICAL' ? 'text-rose-500' : a.severity === 'WARNING' ? 'text-amber-500' : 'text-blue-500'}`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={severityVariant[a.severity]}>{a.severity}</Badge>
                      <span className="text-xs text-ink-400">{a.type.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-sm text-ink-700 dark:text-ink-200">{a.message}</p>
                    <p className="text-xs text-ink-400 mt-1">{format(new Date(a.createdAt), 'MMM d, yyyy - HH:mm')}</p>
                  </div>
                </div>
                {!a.resolved && (
                  <button onClick={() => resolve(a.id)} className="btn-secondary !px-3 !py-1.5 text-xs shrink-0">
                    <Check size={14} /> Resolve
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
