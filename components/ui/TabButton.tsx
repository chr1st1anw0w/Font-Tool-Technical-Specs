import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface TabButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({
  label,
  icon,
  isActive,
  onClick,
  disabled = false
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-all duration-200 relative',
        isActive
          ? 'text-[var(--primary-sky-blue)] border-[var(--primary-sky-blue)]'
          : 'text-[var(--neutral-gray-400)] border-transparent hover:text-white hover:border-[var(--neutral-gray-500)]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      whileHover={!disabled ? { y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
      
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-sky-blue)]"
          layoutId="activeTab"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </motion.button>
  );
};

export default TabButton;