import React from 'react';
import { useInventory } from '../../store/inventoryStore';
import { Icon } from './Icon';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useInventory();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderColor = 'border-blue-300';
        let iconName = 'info';
        let iconColor = 'text-primary';

        if (toast.type === 'success') {
          borderColor = 'border-emerald-300';
          iconName = 'check_circle';
          iconColor = 'text-tertiary';
        } else if (toast.type === 'error') {
          borderColor = 'border-red-300';
          iconName = 'error';
          iconColor = 'text-error';
        } else if (toast.type === 'warning') {
          borderColor = 'border-amber-300';
          iconName = 'warning';
          iconColor = 'text-amber-600';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-surface-container-lowest border ${borderColor} rounded-lg shadow-lg p-3.5 flex items-start gap-3 transition-all transform translate-y-0`}
          >
            <Icon name={iconName} className={`text-xl shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">{toast.title}</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container transition-colors shrink-0"
              title="Dismiss"
            >
              <Icon name="close" className="text-base" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
