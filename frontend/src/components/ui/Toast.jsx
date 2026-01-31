export default function Toast({ toasts }) {
  if (toasts.length === 0) return null;

  const typeClasses = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info'
  };

  return (
    <div className="toast toast-end toast-bottom z-60">
      {toasts.map(toast => (
        <div key={toast.id} className={`alert ${typeClasses[toast.type]} shadow-lg`}>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
