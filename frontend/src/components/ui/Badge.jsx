const styles = {
  success: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  critical: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
};

export default function Badge({ children, variant = 'neutral' }) {
  return <span className={`badge ${styles[variant] || styles.neutral}`}>{children}</span>;
}
