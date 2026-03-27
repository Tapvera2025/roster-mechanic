import { MoreVertical } from 'lucide-react';

/**
 * Reusable Mobile Card Component
 * Converts table rows into touch-friendly cards for mobile views
 */
export default function MobileCard({ title, fields, actions, onAction, className = '' }) {
  return (
    <div className={`mobile-card ${className}`}>
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="mobile-card-title flex-1">{title}</h3>
        {actions && actions.length > 0 && (
          <button
            className="touch-target p-1 -mr-2 text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onAction && onAction();
            }}
            aria-label="More actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Card Fields */}
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={index} className="mobile-card-row">
            <span className="mobile-card-label">{field.label}</span>
            <span className="mobile-card-value">{field.value}</span>
          </div>
        ))}
      </div>

      {/* Card Actions */}
      {actions && actions.length > 0 && (
        <div className="mobile-card-actions">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`touch-target flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                action.variant === 'primary'
                  ? 'bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] hover:bg-[hsl(var(--color-primary-hover))]'
                  : action.variant === 'danger'
                  ? 'bg-[hsl(var(--color-error))] text-[hsl(var(--color-error-foreground))] hover:opacity-90'
                  : action.variant === 'success'
                  ? 'bg-[hsl(var(--color-success))] text-[hsl(var(--color-success-foreground))] hover:opacity-90'
                  : 'bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))] border border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-muted))]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {action.icon && <action.icon className="w-4 h-4 inline mr-2" />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
