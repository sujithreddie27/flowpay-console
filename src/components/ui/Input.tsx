import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      variant = 'default',
      type,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const inputId = id || `input-${Math.random().toString(36).substring(7)}`;

    const baseStyles =
      'w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 disabled:bg-secondary-50 disabled:text-secondary-500 disabled:cursor-not-allowed dark:disabled:bg-secondary-900';

    const variants = {
      default:
        'bg-white border-secondary-300 text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-900 dark:border-secondary-700 dark:text-secondary-100',
      filled:
        'bg-secondary-50 border-transparent text-secondary-900 placeholder-secondary-500 focus:bg-white focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-800 dark:text-secondary-100',
    };

    const errorStyles =
      'border-danger-500 focus:border-danger-500 focus:ring-danger-500 dark:border-danger-600';

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    const paddingWithIcon = {
      sm: leftIcon ? 'pl-9' : rightIcon || isPassword ? 'pr-9' : '',
      md: leftIcon ? 'pl-10' : rightIcon || isPassword ? 'pr-10' : '',
      lg: leftIcon ? 'pl-12' : rightIcon || isPassword ? 'pr-12' : '',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-1.5',
              error ? 'text-danger-600 dark:text-danger-400' : 'text-secondary-700 dark:text-secondary-300'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              'absolute left-0 top-0 bottom-0 flex items-center pointer-events-none',
              sizes[inputSize] === 'px-3 py-1.5 text-sm' ? 'pl-3' : sizes[inputSize] === 'px-4 py-2 text-base' ? 'pl-3' : 'pl-4'
            )}>
              <span className={cn(
                'text-secondary-400 dark:text-secondary-500',
                inputSize === 'sm' ? 'h-4 w-4' : inputSize === 'md' ? 'h-5 w-5' : 'h-6 w-6'
              )}>
                {leftIcon}
              </span>
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            id={inputId}
            disabled={disabled}
            className={cn(
              baseStyles,
              variants[variant],
              sizes[inputSize],
              paddingWithIcon[inputSize],
              error && errorStyles,
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {error && (
            <div className={cn(
              'absolute right-0 top-0 bottom-0 flex items-center pointer-events-none',
              isPassword ? 'pr-10' : sizes[inputSize] === 'px-3 py-1.5 text-sm' ? 'pr-3' : sizes[inputSize] === 'px-4 py-2 text-base' ? 'pr-3' : 'pr-4'
            )}>
              <ExclamationCircleIcon className={cn(
                'text-danger-500',
                inputSize === 'sm' ? 'h-4 w-4' : inputSize === 'md' ? 'h-5 w-5' : 'h-6 w-6'
              )} />
            </div>
          )}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                'absolute right-0 top-0 bottom-0 flex items-center text-secondary-400 hover:text-secondary-600 dark:text-secondary-500 dark:hover:text-secondary-300',
                sizes[inputSize] === 'px-3 py-1.5 text-sm' ? 'pr-3' : sizes[inputSize] === 'px-4 py-2 text-base' ? 'pr-3' : 'pr-4'
              )}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeSlashIcon className={cn(
                  inputSize === 'sm' ? 'h-4 w-4' : inputSize === 'md' ? 'h-5 w-5' : 'h-6 w-6'
                )} />
              ) : (
                <EyeIcon className={cn(
                  inputSize === 'sm' ? 'h-4 w-4' : inputSize === 'md' ? 'h-5 w-5' : 'h-6 w-6'
                )} />
              )}
            </button>
          )}
          {!error && !isPassword && rightIcon && (
            <div className={cn(
              'absolute right-0 top-0 bottom-0 flex items-center pointer-events-none',
              sizes[inputSize] === 'px-3 py-1.5 text-sm' ? 'pr-3' : sizes[inputSize] === 'px-4 py-2 text-base' ? 'pr-3' : 'pr-4'
            )}>
              <span className={cn(
                'text-secondary-400 dark:text-secondary-500',
                inputSize === 'sm' ? 'h-4 w-4' : inputSize === 'md' ? 'h-5 w-5' : 'h-6 w-6'
              )}>
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-danger-600 dark:text-danger-400">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-secondary-500 dark:text-secondary-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
