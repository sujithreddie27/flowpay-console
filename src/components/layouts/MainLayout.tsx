import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useSidebarState } from '@/hooks';
import { cn } from '@/utils';

export function MainLayout() {
  const { isOpen, isCollapsed, open, close, toggleCollapse } = useSidebarState();

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <Sidebar
        isOpen={isOpen}
        isCollapsed={isCollapsed}
        onClose={close}
        onToggleCollapse={toggleCollapse}
      />

      <div
        className={cn(
          'transition-all duration-300',
          isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        )}
      >
        <Header onMenuClick={open} />

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
