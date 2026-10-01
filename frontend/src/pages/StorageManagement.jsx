import { useEffect, useState } from 'react';
import { Battery, Fuel, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { storageApi } from '../api/endpoints';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';

export default function StorageManagement() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, h] = await Promise.all([storageApi.current(), storageApi.history(48)]);
        setCurrent(c.data.data);
        setHistory(h.data.data);
      } catch (err) {
        toast.error('Failed to load storage data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const trendData = history.map((h) => ({
    time: format(new Date(h.timestamp), 'HH:mm'),
    Battery: h.batteryLevel,
    Hydrogen: h.hydrogenLevel,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Battery} label="Battery Level" value={current?.batteryLevel?.toFixed(0) ?? '-'} unit="%" accent="blue" loading={loading} />
        <StatCard icon={Fuel} label="Hydrogen Storage" value={current?.hydrogenLevel?.toFixed(0) ?? '-'} unit="%" accent="brand" loading={loading} />
      </div>

      {current && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Battery Storage" subtitle={`${current.chargingStatus} - ${((current.batteryLevel / 100) * current.batteryCapacity).toFixed(0)} / ${current.batteryCapacity} kWh`}>
            <ProgressBar value={current.batteryLevel} colorClass="bg-blue-500" height="h-4" />
            <div className="flex justify-between text-xs text-ink-400 mt-2">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </Card>
          <Card title="Hydrogen Storage" subtitle={`${((current.hydrogenLevel / 100) * current.hydrogenCapacity).toFixed(0)} / ${current.hydrogenCapacity} kg`}>
            <ProgressBar value={current.hydrogenLevel} colorClass="bg-brand-500" height="h-4" />
            <div className="flex justify-between text-xs text-ink-400 mt-2">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </Card>
        </div>
      )}

      {current?.alerts?.length > 0 && (
        <Card title="Storage Alerts">
          <div className="space-y-2">
            {current.alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                <Badge variant={a.level === 'critical' ? 'critical' : a.level === 'warning' ? 'warning' : 'info'}>{a.level}</Badge>
                <span className="text-ink-600 dark:text-ink-300">{a.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Storage Trend (48h)">
        {loading ? <div className="skeleton h-72 w-full" /> : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="b1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="h1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-100 dark:stroke-ink-800" vertical={false} />
              <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="Battery" stroke="#3b82f6" fill="url(#b1)" strokeWidth={2} />
              <Area type="monotone" dataKey="Hydrogen" stroke="#10b981" fill="url(#h1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
