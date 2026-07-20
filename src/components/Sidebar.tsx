import { Fragment, memo, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  HomeIcon,
  BanknotesIcon,
  ArrowsRightLeftIcon,
  CreditCardIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ShieldCheckIcon,
  DocumentMagnifyingGlassIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/utils';
import { useAppSelector } from '@/store';
import type { NavItem } from '@/types';

interface NavItemWithRole extends NavItem {
  adminOnly?: boolean;
}

const navigation: NavItemWithRole[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Transactions', href: '/transactions', icon: ArrowsRightLeftIcon },
  { name: 'Payments', href: '/payments/new', icon: CreditCardIcon },
  { name: 'Accounts', href: '/accounts', icon: BanknotesIcon },
  { name: 'Monitoring', href: '/monitoring', icon: ChartBarIcon },
  { name: 'Admin', href: '/admin/dashboard', icon: ShieldCheckIcon, adminOnly: true },
  { name: 'Users', href: '/admin/users', icon: UserGroupIcon, adminOnly: true },
  { name: 'All Transactions', href: '/admin/transactions', icon: DocumentMagnifyingGlassIcon, adminOnly: true },
  { name: 'Audit Trail', href: '/admin/audit-trail', icon: ClipboardDocumentListIcon, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

const NavItems = memo(function NavItems({ collapsed }: { collapsed: boolean }) {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  const visibleNavigation = useMemo(
    () => navigation.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  return (
    <nav aria-label="Main navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
      {visibleNavigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          aria-label={collapsed ? item.name : undefined}
          className={({ isActive }) =>
            cn(
              'group flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors duration-150 min-h-[44px]',
              isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-secondary-50',
              collapsed && 'justify-center px-2'
            )
          }
          title={collapsed ? item.name : undefined}
        >
          <item.icon
            className={cn(
              'h-5 w-5 flex-shrink-0',
              collapsed ? '' : 'mr-3'
            )}
            aria-hidden="true"
          />
          {!collapsed && <span className="truncate">{item.name}</span>}
          {!collapsed && item.badge && (
            <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
              {item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
});

export const Sidebar = memo(function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-secondary-900/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-[280px] flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>

                <div className="flex grow flex-col bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-700">
                  <div className="flex h-16 items-center justify-center border-b border-secondary-200 dark:border-secondary-700 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                        <BanknotesIcon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-lg font-bold text-secondary-900 dark:text-white">
                        FlowPay
                      </span>
                    </div>
                  </div>
                  <NavItems collapsed={false} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col border-r border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 transition-all duration-300',
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-secondary-200 dark:border-secondary-700 px-4">
          <div className={cn('flex items-center gap-2', isCollapsed && 'justify-center w-full')}>
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
              <BanknotesIcon className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold text-secondary-900 dark:text-white">
                FlowPay
              </span>
            )}
          </div>
          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              className="p-1.5 rounded-md text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-800 dark:hover:text-secondary-300 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center justify-center py-3 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4 rotate-180" />
          </button>
        )}

        <NavItems collapsed={isCollapsed} />

        {/* Bottom section */}
        <div className="border-t border-secondary-200 dark:border-secondary-700 p-3">
          <div className={cn(
            'flex items-center rounded-lg px-3 py-2 text-sm text-secondary-500 dark:text-secondary-400',
            isCollapsed && 'justify-center px-2'
          )}>
            <div className="h-8 w-8 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-secondary-600 dark:text-secondary-300">FP</span>
            </div>
            {!isCollapsed && (
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                  Admin User
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                  admin@flowpay.io
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
