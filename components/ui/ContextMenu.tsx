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
      type?: 'item';
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

  if (item.type === 'divider') {
    return <div className="h-px bg-gray-200 my-1.5 mx-1" />;
  }

  const handleMouseEnter = () => {
    if (itemRef.current && item.children) {
      const rect = itemRef.current.getBoundingClientRect();
      setSubmenuPosition({ top: rect.top, left: rect.right });
      setIsSubmenuOpen(true);
    }
  };

  return (
    <div 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={() => setIsSubmenuOpen(false)}
        className="relative"
    >
      <button
        ref={itemRef}
        disabled={item.disabled}
        onClick={() => {
          if (!item.disabled && item.action) {
            item.action();
            onClose();
          }
        }}
        className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-500 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-700 cursor-default rounded-sm transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 flex items-center justify-center opacity-70">
              {item.icon}
          </span>
          <span>{item.label}</span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {item.shortcut && <span className="text-[10px] opacity-60">{item.shortcut}</span>}
          {item.children && <ChevronRightIcon className="w-3 h-3 opacity-60" />}
        </div>
      </button>
      <AnimatePresence>
        {isSubmenuOpen && item.children && (
          <ContextMenu
            x={submenuPosition.left}
            y={submenuPosition.top}
            items={item.children}
            onClose={onClose}
            isSubMenu={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose, isSubMenu = false }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSubMenu) {
        const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            onClose();
        }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [onClose, isSubMenu]);

  // Basic viewport collision detection
  const style: React.CSSProperties = {
      top: y,
      left: x,
  };
  if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      if (y + rect.height > window.innerHeight) {
          style.top = y - rect.height;
      }
      if (x + rect.width > window.innerWidth) {
          style.left = x - rect.width;
      }
  }

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="fixed bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-md py-1 min-w-[160px] z-50"
      style={isSubMenu ? { top: y, left: x, position: 'fixed' } : { top: y, left: x }}
    >
      {items.map((item, index) => (
        <MenuItemComponent key={index} item={item} onClose={onClose} />
      ))}
    </motion.div>
  );
};

export default ContextMenu;