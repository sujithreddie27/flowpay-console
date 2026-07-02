import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export function UnsavedChangesDialog({ isOpen, onStay, onLeave }: UnsavedChangesDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onStay} size="sm">
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/30">
            <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 dark:text-warning-400" />
          </div>
          <span>Unsaved Changes</span>
        </div>
      </ModalHeader>
      <ModalBody>
        <p className="text-sm text-secondary-600 dark:text-secondary-300">
          You have unsaved changes that will be lost if you navigate away. Are you sure you want to leave this page?
        </p>
      </ModalBody>
      <ModalFooter>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onStay}
            className="rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            Stay on Page
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-danger-500 focus:ring-offset-2 transition-colors"
          >
            Leave Page
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
