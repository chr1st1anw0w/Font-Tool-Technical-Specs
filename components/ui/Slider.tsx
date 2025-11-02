import React, { useState, useCallback, useEffect } from 'react';
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
}) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    // Only update input value if it's not currently focused
    if (document.activeElement?.tagName !== 'INPUT' || document.activeElement?.id !== `slider-input-${label}`) {
      setInputValue(value.toFixed(0));
    }
  }, [value, label]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  }, [onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    let numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      numValue = value;
    }
    const clampedValue = Math.min(Math.max(numValue, min), max);
    onChange(clampedValue);
    setInputValue(clampedValue.toFixed(0));
  }, [inputValue, min, max, value, onChange]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setInputValue(value.toFixed(0));
      (e.target as HTMLInputElement).blur();
    }
  }, [handleInputBlur, value]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={clsx('space-y-3', className)}>
      <div className="flex justify-between items-center">
        <label htmlFor={`slider-input-${label}`} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex items-center border border-[var(--input-border)] rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-[var(--input-focus-ring)] focus-within:border-[var(--input-focus-ring)] transition-all">
            <input
                id={`slider-input-${label}`}
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className="w-16 text-right pr-0.5 py-1 text-sm bg-transparent focus:outline-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
            />
            {displaySuffix && (
              <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 border-l border-gray-200">{displaySuffix}</span>
            )}
        </div>
      </div>
      
      <div className="relative group">
        <input
          type="range"
          value={value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full h-0.5 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed slider-thumb"
          style={{
            background: `linear-gradient(to right, var(--accent-blue) 0%, var(--accent-blue) ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`
          }}
        />
      </div>
    </div>
  );
};

export default Slider;
