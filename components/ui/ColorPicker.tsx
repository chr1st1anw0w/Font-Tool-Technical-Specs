
import React, { useState, useEffect, useRef } from 'react';

interface ColorPickerProps {
  label: string;
  color: string | null;
  onChange: (color: string | null) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange, disabled, allowEmpty = false }) => {
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
      <div 
          className="flex items-center p-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg cursor-pointer hover:border-[var(--border-highlight)] transition-colors"
          onClick={() => colorInputRef.current?.click()}
      >
        <div 
          className="w-6 h-6 rounded-md border border-[var(--border-color)] mr-3"
          style={{ backgroundColor: color || 'transparent', backgroundImage: !color ? 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)' : 'none', backgroundSize: '8px 8px' }}
        />
        <span className="text-sm font-mono text-[var(--text-primary)] uppercase flex-grow">
            {color || 'None'}
        </span>
        <input
            ref={colorInputRef}
            type="color"
            value={color || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="invisible w-0 h-0"
            disabled={disabled}
          />
      </div>
    </div>
  );
};

export default ColorPicker;
