import { useEffect, useState } from 'react';
import { Factory, Gauge, Target, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { hydrogenApi } from '../api/endpoints';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';

const statusVariant = { RUNNING: 'success', IDLE: 'neutral', MAINTENANCE: 'warning', FAULT: 'critical' };

export default function HydrogenProduction() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, h, s] = await Promise.all([
          hydrogenApi.current(),
          hydrogenApi.history(24),
          hydrogenApi.schedule(),
        ]);
        setCurrent(c.data.data);
        setHistory(h.data.data);
        setSchedule(s.data.data);
      } catch (err) {
        toast.error('Failed to load hydrogen production data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const trendData = history.map((h) => ({
    time: format(new Date(h.timestamp), 'HH:mm'),
    Rate: h.productionRate,
    Target: h.targetRate,
  }));

  const scheduleData = schedule.slice(0, 12).map((s) => ({
    time: format(new Date(s.time), 'HH:mm'),
    Recommended: s.recommendedProductionRate,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Factory} label="Production Rate" value={current?.productionRate?.toFixed(2) ?? '-'} unit="kg/h" accent="brand" loading={loading} />
        <StatCard icon={Target} label="Target Rate" value={current?.targetRate?.toFixed(1) ?? '-'} unit="kg/h" accent="violet" loading={loading} />
        <StatCard icon={Zap} label="Energy Consumed" value={current?.energyConsumed?.toFixed(0) ?? '-'} unit="kW" accent="amber" loading={loading} />
        <StatCard icon={Gauge} label="Electrolyzer Efficiency" value={current?.efficiency?.toFixed(0) ?? '-'} unit="%" accent="blue" loading={loading} />
      </div>

      {current && (
        <Card title="Electrolyzer Status">
          <div className="flex items-center gap-3">
            <Badge variant={statusVariant[current.electrolyzerStatus] || 'neutral'}>{current.electrolyzerStatus}</Badge>
            <span className="text-sm text-ink-500 dark:text-ink-400">
              Producing {current.productionRate} kg/h against a target of {current.targetRate} kg/h
              ({current.targetRate > 0 ? Math.round((current.productionRate / current.targetRate) * 100) : 0}% of target)
            </span>
          </div>
        </Card>
      )}

      <Card title="Production Rate vs Target (24h)">
        {loading ? <div className="skeleton h-72 w-full" /> : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-100 dark:stroke-ink-800" vertical={false} />
              <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Rate" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="Target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Recommended Production Schedule" subtitle="Next 12 hours, based on renewable forecast">
        {loading ? <div className="skeleton h-64 w-full" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={scheduleData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-100 dark:stroke-ink-800" vertical={false} />
              <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Bar dataKey="Recommended" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
