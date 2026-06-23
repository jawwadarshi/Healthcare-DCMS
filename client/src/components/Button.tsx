import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) => {
  const variantStyles = {
    primary: 'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:shadow-lg transform hover:scale-105 disabled:from-teal-400 disabled:to-blue-400 disabled:scale-100',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
    outline: 'border-2 border-teal-600 text-teal-600 hover:bg-teal-50 disabled:border-teal-400 disabled:text-teal-400',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 disabled:cursor-not-allowed';

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
