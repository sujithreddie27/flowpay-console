import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PageTransition } from '@/components/PageTransition';
import { useSidebarState } from '@/hooks';
import { cn } from '@/utils';

export function MainLayout() {
  const { isOpen, isCollapsed, open, close, toggleCollapse } = useSidebarState();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      {/* Skip to content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

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

        <main id="main-content" className="p-4 sm:p-6 lg:p-8" role="main">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
