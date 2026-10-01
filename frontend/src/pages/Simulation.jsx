import { useState } from 'react';
import { FlaskConical, Play, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { simulationApi } from '../api/endpoints';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';

const DEFAULTS = {
  solar: 300,
  wind: 150,
  demand: 250,
  electrolyzerCapacity: 600,
  targetProductionRate: 9,
  batteryLevel: 55,
  batteryCapacity: 1000,
  hydrogenLevel: 40,
  hydrogenCapacity: 500,
};

const FIELDS = [
  { key: 'solar', label: 'Solar Generation (kW)' },
  { key: 'wind', label: 'Wind Generation (kW)' },
  { key: 'demand', label: 'Site Demand (kW)' },
  { key: 'electrolyzerCapacity', label: 'Electrolyzer Capacity (kW)' },
  { key: 'targetProductionRate', label: 'Target H2 Rate (kg/h)' },
  { key: 'batteryLevel', label: 'Battery Level (%)', max: 100 },
  { key: 'batteryCapacity', label: 'Battery Capacity (kWh)' },
  { key: 'hydrogenLevel', label: 'H2 Storage Level (%)', max: 100 },
  { key: 'hydrogenCapacity', label: 'H2 Storage Capacity (kg)' },
];

export default function Simulation() {
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const run = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await simulationApi.run(form);
      setResult(res.data.data);
      toast.success('Simulation complete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation failed - check your inputs');
    } finally {
      setLoading(false);
    }
  };

  const chartData = result ? [
    { name: 'Hydrogen', Current: result.current.hydrogen, Optimized: result.optimized.hydrogen },
    { name: 'Battery', Current: result.current.battery, Optimized: result.optimized.battery },
    { name: 'Grid / Excess', Current: result.current.grid, Optimized: result.optimized.grid },
  ] : [];

  return (
    <div className="space-y-6">
      <Card title="What-If Simulation" subtitle="Enter scenario parameters and run the optimization engine">
        <form onSubmit={run} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label-text">{f.label}</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={f.max}
                required
                className="input-field"
                value={form[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
              />
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setForm(DEFAULTS); setResult(null); }} className="btn-secondary">
              Reset
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Run Optimization
            </button>
          </div>
        </form>
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FlaskConical} label="Efficiency Improvement" value={result.efficiencyImprovement > 0 ? `+${result.efficiencyImprovement}` : result.efficiencyImprovement} unit="%" accent={result.efficiencyImprovement >= 0 ? 'brand' : 'rose'} />
            <StatCard label="Total Generation" value={result.details.totalGeneration.toFixed(0)} unit="kW" accent="amber" />
            <StatCard label="Utilization" value={result.details.utilization} unit="%" accent="blue" />
            <StatCard label="Achievable H2 Rate" value={result.details.achievableProductionRate} unit="kg/h" accent="violet" />
          </div>

          <Card title="Simulated Allocation Result">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-ink-100 dark:stroke-ink-800" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Current" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Optimized" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
}
