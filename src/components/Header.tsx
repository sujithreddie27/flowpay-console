import { Fragment, useState, useRef, memo } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = memo(function Header({ onMenuClick }: HeaderProps) {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      handler: () => {
        searchInputRef.current?.focus();
        setShowSearch(true);
      },
      description: 'Focus search',
    },
    {
      key: 'Escape',
      handler: () => {
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
          setShowSearch(false);
          setSearchQuery('');
        }
      },
      preventDefault: false,
      description: 'Close search / modals',
    },
  ]);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-secondary-200 dark:border-secondary-700 bg-white/95 dark:bg-secondary-900/95 backdrop-blur-sm px-4 sm:px-6">
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden -m-2.5 p-2.5 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex flex-1 items-center justify-between gap-4 lg:gap-6">
        {/* Search */}
        <div className="flex flex-1 max-w-lg">
          <div className={cn(
            'relative w-full transition-all duration-200',
            showSearch ? 'opacity-100' : 'opacity-100'
          )}>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-4 w-4 text-secondary-400" aria-hidden="true" />
            </div>
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search transactions, accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setShowSearch(false)}
              aria-label="Search transactions and accounts"
              className="block w-full rounded-lg border-0 bg-secondary-50 dark:bg-secondary-800 py-2 pl-10 pr-16 text-sm text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-400 dark:placeholder:text-secondary-500 ring-1 ring-inset ring-secondary-200 dark:ring-secondary-700 focus:ring-2 focus:ring-primary-500 transition-all"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-secondary-300 dark:border-secondary-600 bg-secondary-100 dark:bg-secondary-700 px-1.5 py-0.5 text-[10px] font-medium text-secondary-500 dark:text-secondary-400">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDark}
            className="p-2 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:text-secondary-200 dark:hover:bg-secondary-800 transition-colors"
          >
            <span className="sr-only">Toggle theme</span>
            {isDark ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>

          {/* Notifications */}
          <Menu as="div" className="relative">
            <Menu.Button className="relative p-2 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:text-secondary-200 dark:hover:bg-secondary-800 transition-colors">
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white dark:ring-secondary-900" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl bg-white dark:bg-secondary-800 shadow-lg ring-1 ring-secondary-200 dark:ring-secondary-700 focus:outline-none overflow-hidden">
                <div className="px-4 py-3 border-b border-secondary-100 dark:border-secondary-700">
                  <p className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
                    Notifications
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  <Menu.Item>
                    {({ active }) => (
                      <div
                        className={cn(
                          'px-4 py-3 border-b border-secondary-50 dark:border-secondary-700/50 cursor-pointer',
                          active && 'bg-secondary-50 dark:bg-secondary-700/50'
                        )}
                      >
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          Payment Received
                        </p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                          ₹25,000 credited to account ***4521
                        </p>
                        <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                          2 minutes ago
                        </p>
                      </div>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <div
                        className={cn(
                          'px-4 py-3 border-b border-secondary-50 dark:border-secondary-700/50 cursor-pointer',
                          active && 'bg-secondary-50 dark:bg-secondary-700/50'
                        )}
                      >
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          Transaction Failed
                        </p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                          Transfer to HDFC ***8876 failed - insufficient funds
                        </p>
                        <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                          15 minutes ago
                        </p>
                      </div>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <div
                        className={cn(
                          'px-4 py-3 cursor-pointer',
                          active && 'bg-secondary-50 dark:bg-secondary-700/50'
                        )}
                      >
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          System Update
                        </p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                          Scheduled maintenance at 2:00 AM IST
                        </p>
                        <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                          1 hour ago
                        </p>
                      </div>
                    )}
                  </Menu.Item>
                </div>
                <div className="px-4 py-2 border-t border-secondary-100 dark:border-secondary-700">
                  <button className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                    View all notifications
                  </button>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* User Avatar */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">A</span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  Admin
                </p>
              </div>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white dark:bg-secondary-800 shadow-lg ring-1 ring-secondary-200 dark:ring-secondary-700 focus:outline-none overflow-hidden">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/settings"
                      className={cn(
                        'block px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-300',
                        active && 'bg-secondary-50 dark:bg-secondary-700/50'
                      )}
                    >
                      Your Profile
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/settings"
                      className={cn(
                        'block px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-300',
                        active && 'bg-secondary-50 dark:bg-secondary-700/50'
                      )}
                    >
                      Settings
                    </a>
                  )}
                </Menu.Item>
                <div className="border-t border-secondary-100 dark:border-secondary-700" />
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={cn(
                        'block w-full text-left px-4 py-2.5 text-sm text-danger-600 dark:text-danger-400',
                        active && 'bg-secondary-50 dark:bg-secondary-700/50'
                      )}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
});
