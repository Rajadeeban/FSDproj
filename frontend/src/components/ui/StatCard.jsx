import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, unit, trend, accent = 'brand', loading }) {
  const accentClasses = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  };

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-9 w-9 mb-4" />
        <div className="skeleton h-3 w-20 mb-2" />
        <div className="skeleton h-6 w-24" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card card-hover"
    >
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${accentClasses[accent]}`}>
          {Icon && <Icon size={19} strokeWidth={2} />}
        </div>
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-ink-500 dark:text-ink-400 mt-4">{label}</p>
      <p className="text-2xl font-bold text-ink-900 dark:text-white mt-1">
        {value}
        {unit && <span className="text-sm font-medium text-ink-400 ml-1">{unit}</span>}
      </p>
    </motion.div>
  );
}
