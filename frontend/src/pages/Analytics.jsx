import { useEffect, useState } from 'react';
import { Download, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { analyticsApi } from '../api/endpoints';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';

export default function Analytics() {
  const [forecast, setForecast] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [forecastHours, setForecastHours] = useState(24);
  const [loading, setLoading] = useState(true);

  const load = async (hours) => {
    setLoading(true);
    try {
      const [f, a] = await Promise.all([analyticsApi.forecast(hours), analyticsApi.analytics(7)]);
      setForecast(f.data.data);
      setAnalytics(a.data.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(forecastHours); }, [forecastHours]);

  const forecastData = forecast.map((f) => ({
    time: format(new Date(f.timestamp), forecastHours > 24 ? 'MMM d HH:mm' : 'HH:mm'),
    Generation: f.totalGeneration,
    Demand: f.demand,
  }));

  const handleExport = () => {
    const token = localStorage.getItem('greenh2_token');
    const url = analyticsApi.exportUrl(7);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'greenh2_export_7d.csv';
        link.click();
        toast.success('CSV exported');
      })
      .catch(() => toast.error('Export failed'));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Total Generated (7d)" value={analytics?.totalGenerated?.toFixed(0) ?? '-'} unit="kWh" accent="amber" loading={loading} />
        <StatCard icon={TrendingUp} label="Utilization Rate" value={analytics?.utilizationRate ?? '-'} unit="%" accent="brand" loading={loading} />
        <StatCard icon={TrendingDown} label="Wastage Rate" value={analytics?.wastageRate ?? '-'} unit="%" accent="rose" loading={loading} />
        <StatCard label="Hydrogen Produced (7d)" value={analytics?.totalH2Produced?.toFixed(0) ?? '-'} unit="kg" accent="violet" loading={loading} />
      </div>

      <Card
        title="Renewable Energy Forecast"
        subtitle="Projected solar + wind generation vs demand"
        action={
          <div className="flex gap-1 bg-ink-100 dark:bg-ink-800 rounded-lg p-1">
            {[24, 168].map((h) => (
              <button
                key={h}
                onClick={() => setForecastHours(h)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${forecastHours === h ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-white shadow-sm' : 'text-ink-500'}`}
              >
                {h === 24 ? '24h' : '7d'}
              </button>
            ))}
          </div>
        }
      >
        {loading ? <div className="skeleton h-72 w-full" /> : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-100 dark:stroke-ink-800" vertical={false} />
              <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Generation" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="Demand" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Hydrogen Production Trend" subtitle="Average daily production rate (7d)">
        {loading ? <div className="skeleton h-64 w-full" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics?.hydrogenTrend || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-100 dark:stroke-ink-800" vertical={false} />
              <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Bar dataKey="avgProductionRate" name="Avg kg/h" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Export Data" subtitle="Download energy readings as CSV">
        <button onClick={handleExport} className="btn-secondary">
          <Download size={16} /> Export last 7 days (CSV)
        </button>
      </Card>
    </div>
  );
}
