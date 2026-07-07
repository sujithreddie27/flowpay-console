import { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  /** On mobile, take up full screen height */
  mobileFullScreen?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  mobileFullScreen = false,
}: ModalProps) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={closeOnOverlayClick ? onClose : () => {}}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className={cn(
            'flex min-h-full items-center justify-center text-center',
            mobileFullScreen ? 'p-0 sm:p-4' : 'p-4'
          )}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 sm:translate-y-0 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 sm:translate-y-0 translate-y-4"
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform overflow-hidden bg-white dark:bg-secondary-900 text-left align-middle shadow-2xl transition-all',
                  mobileFullScreen
                    ? 'min-h-screen sm:min-h-0 rounded-none sm:rounded-2xl'
                    : 'rounded-2xl',
                  sizes[size]
                )}
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              >
                {showCloseButton && (
                  <button
                    type="button"
                    className="absolute right-3 top-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-800 dark:hover:text-secondary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 sm:right-4 sm:top-4"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

export const ModalHeader = ({ children, className }: ModalHeaderProps) => {
  return (
    <div className={cn('px-6 pt-6 pb-4', className)}>
      <Dialog.Title
        as="h3"
        className="text-xl font-semibold leading-6 text-secondary-900 dark:text-secondary-100"
      >
        {children}
      </Dialog.Title>
    </div>
  );
};

export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export const ModalBody = ({ children, className }: ModalBodyProps) => {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
};

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const ModalFooter = ({ children, className, align = 'right' }: ModalFooterProps) => {
  const alignments = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={cn('px-6 py-4 bg-secondary-50 dark:bg-secondary-800/50 flex items-center gap-3', alignments[align], className)}>
      {children}
    </div>
  );
};
