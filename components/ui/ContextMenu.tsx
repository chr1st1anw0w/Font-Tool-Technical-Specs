
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon } from '../icons';

export type MenuItem =
  | {
      label: string;
      icon?: React.ReactNode;
      action?: () => void;
      shortcut?: string;
      disabled?: boolean;
      children?: MenuItem[];
    }
  | { type: 'divider' };

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
  isSubMenu?: boolean;
}

const MenuItemComponent: React.FC<{ item: MenuItem; onClose: () => void }> = ({ item, onClose }) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const itemRef = useRef<HTMLButtonElement>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });

  // FIX: Use 'label' in item to definitively distinguish between the action item and the divider.
  // This ensures TypeScript correctly narrows the type for destructuring below.
  if (!('label' in item)) {
    return <div className="h-px bg-gray-300/50 my-1.5" />;
  }

  const { label, icon, action, shortcut, disabled, children } = item;

  const handleMouseEnter = () => {
    if (itemRef.current && children) {
      const rect = itemRef.current.getBoundingClientRect();
      const subMenuWidth = 240; // Corresponds to w-60
      let left = rect.right;
      if (left + subMenuWidth > window.innerWidth) {
        left = rect.left - subMenuWidth;
      }
      setSubmenuPosition({ top: rect.top, left });
      setIsSubmenuOpen(true);
    }
  };

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={() => setIsSubmenuOpen(false)}>
      <button
        ref={itemRef}
        disabled={disabled}
        onClick={() => {
          if (!disabled && action) {
            action();
            onClose();
          }
        }}
        className="w-full flex items-center justify-between text-left px-3 py-2 text-sm text-gray-800 rounded-md hover:bg-blue-500 hover:text-white disabled:opacity-40 disabled:bg-transparent disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon ? <span className="w-4 h-4 text-gray-600">{icon}</span> : <span className="w-4 h-4" />}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {shortcut && <span className="text-xs text-gray-400">{shortcut}</span>}
          {children && <ChevronRightIcon className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {isSubmenuOpen && children && (
        <ContextMenu
            x={submenuPosition.left}
            y={submenuPosition.top}
            items={children}
            onClose={onClose}
            isSubMenu={true}
        />
      )}
    </div>
  );
};

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose, isSubMenu = false }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ top: y, left: x });

  useEffect(() => {
    if (isSubMenu) return; // Only top-level menu listens for outside clicks

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isSubMenu]);

  useEffect(() => {
    if (menuRef.current) {
        const menuHeight = menuRef.current.offsetHeight;
        const menuWidth = menuRef.current.offsetWidth;
        let top = y;
        let left = x;

        if (y + menuHeight > window.innerHeight) {
            top = window.innerHeight - menuHeight - 10;
        }
        if (x + menuWidth > window.innerWidth) {
            left = window.innerWidth - menuWidth - 10;
        }
        if (top < 0) top = 10;
        if (left < 0) left = 10;

        setPosition({ top, left });
    }
  }, [x, y, items]); // Re-calculate on items change as height might change

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        className="fixed z-50 w-60 bg-white/80 backdrop-blur-md rounded-lg shadow-2xl border border-gray-200/50 p-1.5"
        style={{ top: position.top, left: position.left }}
        initial={{ opacity: 0, scale: 0.95, y: isSubMenu ? 0 : -5, x: isSubMenu ? -5 : 0 }}
        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
      >
        {items.map((item, index) => (
          <MenuItemComponent key={index} item={item} onClose={onClose} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

export default ContextMenu;
