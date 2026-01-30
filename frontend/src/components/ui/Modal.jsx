export default function Modal({ isOpen, onClose, title, children, actions, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-5xl'
  };

  return (
    <dialog className="modal modal-open">
      <div className={`modal-box glass-modal animate-fadeInUp ${sizeClasses[size]}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-base-200/30">
          <h3 className="font-bold text-xl text-gradient">{title}</h3>
          <button
            className="btn btn-sm btn-circle btn-ghost text-base-content/50 hover:text-base-content hover:bg-base-200/50"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="py-2">{children}</div>

        {/* Actions */}
        {actions && (
          <div className="modal-action pt-6 mt-6 border-t border-base-200/30 flex justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop bg-black/40 backdrop-blur-sm">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

// Componente auxiliar para seções do formulário
export function FormSection({ title, children, icon }) {
  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center gap-2 text-sm font-semibold text-base-content/70 uppercase tracking-wide">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// Componente para grupos de campos em linha
export function FormRow({ children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {children}
    </div>
  );
}

// Componente de campo de formulário melhorado
export function FormField({ label, required, children, hint }) {
  return (
    <div className="form-control w-full">
      <label className="label pb-1">
        <span className="label-text font-medium text-base-content/80">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
      </label>
      {children}
      {hint && (
        <label className="label pt-1">
          <span className="label-text-alt text-base-content/50">{hint}</span>
        </label>
      )}
    </div>
  );
}

// Separador visual
export function FormDivider() {
  return <div className="divider my-6"></div>;
}
