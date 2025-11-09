import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from '../icons';

interface ColorPickerProps {
  label: string;
  color: string | null;
  onChange: (color: string | null) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange, disabled, allowEmpty = false }) => {
  const [inputValue, setInputValue] = useState(color || '');
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(color || '');
  }, [color]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let validColor = inputValue;
    if (!/^#[0-9a-fA-F]{6}$/.test(validColor) && !/^#[0-9a-fA-F]{3}$/.test(validColor)) {
      validColor = color || '#000000';
    }
    if (validColor !== color) {
      onChange(validColor);
    }
    setInputValue(validColor);
  };
  
  const handleClearColor = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>
      <div className="flex items-center space-x-2">
        <div 
          className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer relative"
          style={{ 
            backgroundColor: color || '#ffffff',
            backgroundImage: !color ? `
              linear-gradient(45deg, #ccc 25%, transparent 25%),
              linear-gradient(-45deg, #ccc 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #ccc 75%),
              linear-gradient(-45deg, transparent 75%, #ccc 75%)`
            : undefined,
            backgroundSize: '10px 10px',
            backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
          }}
          onClick={() => colorInputRef.current?.click()}
        >
          <input
            ref={colorInputRef}
            type="color"
            value={color || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="opacity-0 w-full h-full cursor-pointer"
            disabled={disabled}
          />
        </div>
        <div className="relative flex-grow">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
            placeholder={allowEmpty && !color ? '無' : '#000000'}
          />
           {allowEmpty && color && (
            <button onClick={handleClearColor} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <XIcon className="w-4 h-4" />
            </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;