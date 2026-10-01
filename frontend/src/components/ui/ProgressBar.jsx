export default function ProgressBar({ value, max = 100, colorClass = 'bg-brand-500', height = 'h-2.5' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`w-full ${height} rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden`}>
      <div
        className={`${height} rounded-full ${colorClass} transition-all duration-500 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
