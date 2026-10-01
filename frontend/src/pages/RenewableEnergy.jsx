import { useEffect, useState } from 'react';
import { Sun, Wind } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { renewableApi } from '../api/endpoints';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';

const RANGE_OPTIONS = [
  { label: '24h', value: 24 },
  { label: '3d', value: 72 },
  { label: '7d', value: 168 },
];

export default function RenewableEnergy() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState(24);
  const [loading, setLoading] = useState(true);

  const load = async (hours) => {
    setLoading(true);
    try {
      const [c, h] = await Promise.all([renewableApi.current(), renewableApi.history(hours)]);
      setCurrent(c.data.data);
      setHistory(h.data.data);
    } catch (err) {
      toast.error('Failed to load renewable energy data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(range); }, [range]);

  const chartData = history.map((h) => ({
    time: format(new Date(h.timestamp), range > 24 ? 'MMM d HH:mm' : 'HH:mm'),
    Solar: h.solar,
    Wind: h.wind,
  }));

  return (
    <div className="space-y-6">
      {loading && !current ? (
        <div className="grid grid-cols-2 gap-4">
          <StatCard loading /><StatCard loading />
        </div>
      ) : current && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Sun} label="Solar Generation" value={current.solar.generation.toFixed(0)} unit="kW" accent="amber" trend={current.solar.efficiency > 50 ? 5 : -3} />
          <StatCard icon={Wind} label="Wind Generation" value={current.wind.generation.toFixed(0)} unit="kW" accent="blue" trend={current.wind.efficiency > 50 ? 4 : -2} />
        </div>
      )}

      {current && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Solar Capacity & Efficiency">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-ink-500 dark:text-ink-400">{current.solar.generation} / {current.solar.capacity} kW</span>
              <span className="font-semibold text-amber-600">{current.solar.efficiency}%</span>
            </div>
            <ProgressBar value={current.solar.generation} max={current.solar.capacity} colorClass="bg-amber-500" />
          </Card>
          <Card title="Wind Capacity & Efficiency">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-ink-500 dark:text-ink-400">{current.wind.generation} / {current.wind.capacity} kW</span>
              <span className="font-semibold text-blue-600">{current.wind.efficiency}%</span>
            </div>
            <ProgressBar value={current.wind.generation} max={current.wind.capacity} colorClass="bg-blue-500" />
          </Card>
        </div>
      )}

      <Card
        title="Generation History"
        subtitle="Solar and wind output over time"
        action={
          <div className="flex gap-1 bg-ink-100 dark:bg-ink-800 rounded-lg p-1">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${range === r.value ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-white shadow-sm' : 'text-ink-500'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="skeleton h-72 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="s2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="w2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-100 dark:stroke-ink-800" vertical={false} />
              <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="Solar" stroke="#f59e0b" fill="url(#s2)" strokeWidth={2} />
              <Area type="monotone" dataKey="Wind" stroke="#3b82f6" fill="url(#w2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
