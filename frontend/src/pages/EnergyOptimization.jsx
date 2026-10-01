import { useState } from 'react';
import { SlidersHorizontal, Loader2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { optimizationApi } from '../api/endpoints';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';

export default function EnergyOptimization() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await optimizationApi.run();
      setResult(res.data.data);
      toast.success('Optimization complete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Optimization failed');
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
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <SlidersHorizontal size={19} />
            </div>
            <div>
              <h3 className="font-semibold text-ink-900 dark:text-white">Live Energy Optimization</h3>
              <p className="text-sm text-ink-500 dark:text-ink-400">Runs the rule-based engine against current live plant data</p>
            </div>
          </div>
          <button onClick={run} disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <SlidersHorizontal size={16} />}
            Run Optimization
          </button>
        </div>
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={TrendingUp} label="Efficiency Improvement" value={result.efficiencyImprovement > 0 ? `+${result.efficiencyImprovement}` : result.efficiencyImprovement} unit="%" accent={result.efficiencyImprovement >= 0 ? 'brand' : 'rose'} />
            <StatCard label="Total Generation" value={result.details.totalGeneration.toFixed(0)} unit="kW" accent="amber" />
            <StatCard label="Utilization" value={result.details.utilization} unit="%" accent="blue" />
            <StatCard label="Achievable H2 Rate" value={result.details.achievableProductionRate} unit="kg/h" accent="violet" />
          </div>

          <Card title="Current vs Optimized Allocation" subtitle={`Algorithm: ${result.algorithm}`}>
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

          {result.details.productionThrottled && (
            <Card className="!bg-amber-50 dark:!bg-amber-900/20 !border-amber-200 dark:!border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Hydrogen production is currently throttled below target - either available energy or hydrogen storage headroom is the limiting factor.
              </p>
            </Card>
          )}
        </>
      )}

      {!result && !loading && (
        <div className="text-center py-12 text-ink-400 text-sm">
          Click "Run Optimization" to compute the optimal allocation for current conditions.
        </div>
      )}
    </div>
  );
}
