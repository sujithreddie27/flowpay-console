import { useCallback, useRef } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';
import type { BlockerFunction } from 'react-router-dom';

interface UseUnsavedChangesOptions {
  isDirty: boolean;
  message?: string;
}

export function useUnsavedChanges({
  isDirty,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: UseUnsavedChangesOptions) {
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Block browser tab/window close
  useBeforeUnload(
    useCallback(
      (e: BeforeUnloadEvent) => {
        if (isDirtyRef.current) {
          e.preventDefault();
          e.returnValue = message;
          return message;
        }
      },
      [message]
    )
  );

  // Block React Router navigation
  const shouldBlock: BlockerFunction = useCallback(
    ({ currentLocation, nextLocation }) => {
      return isDirtyRef.current && currentLocation.pathname !== nextLocation.pathname;
    },
    []
  );

  const blocker = useBlocker(shouldBlock);

  return {
    blocker,
    isBlocked: blocker.state === 'blocked',
    proceed: () => blocker.state === 'blocked' && blocker.proceed(),
    reset: () => blocker.state === 'blocked' && blocker.reset(),
  };
}
