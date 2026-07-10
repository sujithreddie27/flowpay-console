import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import {
  UserPlusIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters')
      .regex(
        /^[a-zA-Z\s'-]+$/,
        'Name can only contain letters, spaces, hyphens, and apostrophes'
      ),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .toLowerCase(),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(
        /^[\d\s()+-]+$/,
        'Please enter a valid phone number'
      )
      .min(10, 'Phone number must be at least 10 digits'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    terms: z
      .boolean()
      .refine((val) => val === true, 'You must accept the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { register: registerUser, isLoading, error: authError, clearError } = useAuth();

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
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    clearError();

    try {
      await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again later.'
      );
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
          <UserPlusIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-secondary-900 dark:text-white">
          Create Account
        </h2>
        <p className="mt-2 text-secondary-600 dark:text-secondary-400">
          Join FlowPay to start managing payments
        </p>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800 mb-6">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Registration Error
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                {apiError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Full Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            {...register('name')}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors ${
              errors.name
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-secondary-300 dark:border-secondary-600 focus:border-indigo-500 focus:ring-indigo-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            placeholder="John Doe"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            {...register('email')}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors ${
              errors.email
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-secondary-300 dark:border-secondary-600 focus:border-indigo-500 focus:ring-indigo-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            placeholder="john@example.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            {...register('phone')}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors ${
              errors.phone
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-secondary-300 dark:border-secondary-600 focus:border-indigo-500 focus:ring-indigo-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            placeholder="+1 (555) 000-0000"
            disabled={isLoading}
          />
          {errors.phone && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300"
          >
            Password
          </label>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              {...register('password')}
              className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors ${
                errors.password
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-secondary-300 dark:border-secondary-600 focus:border-indigo-500 focus:ring-indigo-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300"
          >
            Confirm Password
          </label>
          <div className="relative mt-1">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              {...register('confirmPassword')}
              className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors ${
                errors.confirmPassword
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-secondary-300 dark:border-secondary-600 focus:border-indigo-500 focus:ring-indigo-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300"
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms & Conditions */}
        <div>
          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              {...register('terms')}
              className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-secondary-300 dark:border-secondary-600 rounded mt-1 ${
                errors.terms ? 'border-red-300' : ''
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isLoading}
            />
            <label
              htmlFor="terms"
              className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300"
            >
              I agree to the{' '}
              <a
                href="#"
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="#"
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.terms && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.terms.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
