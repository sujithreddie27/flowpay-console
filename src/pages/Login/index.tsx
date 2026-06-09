import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
          Enter your credentials to access the console
        </p>
      </div>

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input-field"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="input-field pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-secondary-600 dark:text-secondary-400">
              Remember me
            </span>
          </label>
          <a
            href="#"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Forgot password?
          </a>
        </div>

        <button type="submit" className="btn-primary w-full py-2.5">
          Sign in
        </button>
      </form>
    </div>
  );
}
