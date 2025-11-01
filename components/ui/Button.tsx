import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-[var(--primary-tech-blue)] to-[var(--primary-sky-blue)] text-white shadow-lg hover:shadow-xl focus:ring-[var(--primary-sky-blue)] active:scale-95',
    secondary: 'bg-[var(--neutral-gray-700)] border border-[var(--neutral-gray-600)] text-[var(--neutral-gray-200)] hover:bg-[var(--neutral-gray-600)] focus:ring-[var(--neutral-gray-500)]',
    icon: 'bg-[var(--neutral-gray-700)] border border-[var(--neutral-gray-600)] text-[var(--neutral-gray-300)] hover:bg-[var(--neutral-gray-600)] focus:ring-[var(--neutral-gray-500)]',
    ghost: 'text-[var(--neutral-gray-300)] hover:bg-[var(--neutral-gray-700)] focus:ring-[var(--neutral-gray-500)]'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg'
  };
  
  const iconSizeClasses = {
    sm: 'w-8 h-8 rounded-md',
    md: 'w-10 h-10 rounded-lg',
    lg: 'w-12 h-12 rounded-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        variant === 'icon' ? iconSizeClasses[size] : sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  );
};

export default Button;