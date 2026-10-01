export default function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="font-semibold text-ink-900 dark:text-white">{title}</h3>}
            {subtitle && <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
