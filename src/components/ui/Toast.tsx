import { Fragment, createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Transition } from '@headlessui/react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export interface ToastProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
  maxToasts?: number;
}

export const ToastProvider = ({
  children,
  position = 'top-right',
  maxToasts = 5,
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = {
        ...toast,
        id,
        duration: toast.duration ?? 5000,
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        return updated.slice(-maxToasts);
      });

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }
    },
    [maxToasts]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) => {
      addToast({ type: 'success', title, message });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      addToast({ type: 'error', title, message });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      addToast({ type: 'warning', title, message });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      addToast({ type: 'info', title, message });
    },
    [addToast]
  );

  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <div
        className={cn('fixed z-50 flex flex-col gap-2 pointer-events-none', positions[position])}
        style={{ maxWidth: '420px' }}
        aria-live="polite"
        aria-atomic="false"
        role="status"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const ToastItem = ({ toast, onClose }: ToastItemProps) => {
  const [show, setShow] = useState(true);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  };

  const colors = {
    success: 'text-success-500 bg-success-50 dark:bg-success-900/20',
    error: 'text-danger-500 bg-danger-50 dark:bg-danger-900/20',
    warning: 'text-warning-500 bg-warning-50 dark:bg-warning-900/20',
    info: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20',
  };

  const Icon = icons[toast.type];

  return (
    <Transition
      show={show}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white dark:bg-secondary-900 shadow-lg ring-1 ring-black ring-opacity-5">
        <div className="p-4">
          <div className="flex items-start">
            <div className={cn('flex-shrink-0 rounded-lg p-2', colors[toast.type])}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {toast.title}
              </p>
              {toast.message && (
                <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
                  {toast.message}
                </p>
              )}
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <div className="ml-4 flex flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex rounded-lg text-secondary-400 hover:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:hover:text-secondary-300"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
};
