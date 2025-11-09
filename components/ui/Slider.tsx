
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
    if (document.activeElement?.id !== `slider-input-${label}`) {
      setInputValue(value.toFixed(0));
    }
  }, [value, label]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  }, [onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const numVal = parseFloat(e.target.value);
    if (!isNaN(numVal)) onChange(Math.min(Math.max(numVal, min), max));
  }, [min, max, onChange]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={clsx('space-y-2', className)}>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
        <div className="flex items-center bg-[var(--bg-input)] rounded text-xs text-[var(--text-primary)] px-2 py-1 border border-[var(--border-color)] focus-within:border-[var(--accent-primary)] transition-colors">
            <input
                id={`slider-input-${label}`}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                className="w-8 text-right bg-transparent focus:outline-none"
            />
            <span className="text-[var(--text-tertiary)] ml-0.5">{displaySuffix}</span>
        </div>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute h-1 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
             <div className="h-full bg-[var(--accent-primary)]" style={{ width: `${percentage}%` }} />
        </div>
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleSliderChange}
          disabled={disabled}
          className="absolute w-full opacity-0 cursor-pointer h-full" // Use invisible native slider for interaction, custom styled track below
        />
        {/* Custom Thumb (Visual only, follows percentage) */}
        <div 
            className="absolute w-3.5 h-3.5 bg-white border-2 border-[var(--accent-primary)] rounded-full top-1/2 -translate-y-1/2 -ml-[7px] pointer-events-none shadow-sm"
            style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default Slider;
