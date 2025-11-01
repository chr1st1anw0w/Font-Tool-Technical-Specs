import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  displaySuffix?: string;
  disabled?: boolean;
  className?: string;
  minLabel?: string;
  maxLabel?: string;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  displaySuffix = '',
  disabled = false,
  className,
  minLabel,
  maxLabel,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  }, [onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(Math.max(numValue, min), max);
      onChange(clampedValue);
      setInputValue(clampedValue.toString());
    } else {
      setInputValue(value.toString());
    }
  }, [inputValue, min, max, value, onChange]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setInputValue(value.toString());
      (e.target as HTMLInputElement).blur();
    }
  }, [handleInputBlur, value]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={clsx('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex items-center text-sm font-medium text-gray-700">
          {value.toFixed(0)}{displaySuffix}
        </div>
      </div>
      
      <div className="relative group">
        <input
          type="range"
          value={value}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed slider-thumb"
          style={{
            background: `linear-gradient(to right, var(--accent-blue) 0%, var(--accent-blue) ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`
          }}
        />
      </div>

       {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-gray-500 -mt-1">
            <span>{minLabel}</span>
            <span>{value.toFixed(0)}{displaySuffix}</span>
            <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
};

export default Slider;
