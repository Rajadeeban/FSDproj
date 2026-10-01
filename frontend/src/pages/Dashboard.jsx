import { useEffect, useState } from 'react';
import { Sun, Factory, Battery, Gauge, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { dashboardApi } from '../api/endpoints';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';

const statusVariant = { HEALTHY: 'success', WARNING: 'warning', CRITICAL: 'critical' };
const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await dashboardApi.overview();
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <StatCard key={i} loading />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const energyTrend = data.trend.energy.map((e) => ({
    time: format(new Date(e.time), 'HH:mm'),
    Solar: e.solar,
    Wind: e.wind,
    Demand: e.demand,
  }));

  const allocationPie = [
    { name: 'Hydrogen Production', value: data.hydrogen.efficiency ? data.hydrogen.productionRate * 55 : 0 },
    { name: 'Battery Storage', value: data.storage.batteryLevel },
    { name: 'Grid / Excess', value: Math.max(0, data.generation.total - data.generation.demand) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 card !py-4">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${data.systemStatus === 'HEALTHY' ? 'bg-brand-500' : data.systemStatus === 'WARNING' ? 'bg-amber-500' : 'bg-rose-500'} animate-pulseSoft`} />
          <span className="text-sm font-medium text-ink-700 dark:text-ink-200">System Status:</span>
          <Badge variant={statusVariant[data.systemStatus]}>{data.systemStatus}</Badge>
        </div>
        <div className="text-sm text-ink-500 dark:text-ink-400">
          {data.activeAlertsCount} active alert{data.activeAlertsCount !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Sun} label="Solar + Wind Generation" value={data.generation.total.toFixed(0)} unit="kW" accent="amber" />
        <StatCard icon={Factory} label="Hydrogen Production" value={data.hydrogen.productionRate.toFixed(2)} unit="kg/h" accent="brand" />
        <StatCard icon={Battery} label="Battery Storage" value={data.storage.batteryLevel.toFixed(0)} unit="%" accent="blue" />
        <StatCard icon={Gauge} label="System Efficiency" value={data.systemEfficiency.toFixed(1)} unit="%" accent="violet" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Generation vs Demand (last 12h)" subtitle="Solar, wind and site demand" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={energyTrend}>
              <defs>
                <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-100 dark:stroke-ink-800" vertical={false} />
              <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="Solar" stroke="#f59e0b" fill="url(#solarGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Wind" stroke="#3b82f6" fill="url(#windGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Demand" stroke="#ef4444" fill="transparent" strokeWidth={2} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Energy Allocation" subtitle="Current split">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={allocationPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {allocationPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} layout="vertical" align="center" verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Storage Overview">
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-ink-500 dark:text-ink-400">Battery ({data.storage.chargingStatus})</span>
                <span className="font-semibold text-ink-800 dark:text-ink-100">{data.storage.batteryLevel.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${data.storage.batteryLevel}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-ink-500 dark:text-ink-400">Hydrogen Storage</span>
                <span className="font-semibold text-ink-800 dark:text-ink-100">{data.storage.hydrogenLevel.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${data.storage.hydrogenLevel}%` }} />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Recent Notices">
          <div className="space-y-2.5">
            {data.liveAlertsPreview.length === 0 && (
              <p className="text-sm text-ink-400 flex items-center gap-2"><Activity size={15} /> All systems nominal</p>
            )}
            {data.liveAlertsPreview.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <Badge variant={a.severity === 'CRITICAL' ? 'critical' : a.severity === 'WARNING' ? 'warning' : 'info'}>
                  {a.severity}
                </Badge>
                <span className="text-ink-600 dark:text-ink-300">{a.message}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
