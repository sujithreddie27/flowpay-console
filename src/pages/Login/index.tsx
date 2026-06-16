import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { login, isLoading, error: authError, clearError } = useAuth();

  // Sync Redux auth error to local state
  useEffect(() => {
    if (authError) {
      setApiError(authError);
    }
  }, [authError]);

  // Clear auth error on unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    clearError();

    try {
      await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Login failed. Please check your credentials and try again.'
      );
    }
  };

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

      {/* API Error Alert */}
      {apiError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Authentication Error
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                {apiError}
              </p>
            </div>
          </div>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={`input-field ${
              errors.email
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : ''
            }`}
            placeholder="you@example.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
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
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className={`input-field pr-10 ${
                errors.password
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : ''
              }`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              disabled={isLoading}
            />
            <span className="text-sm text-secondary-600 dark:text-secondary-400">
              Remember me
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Register Link */}
      <div className="text-center">
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
}
