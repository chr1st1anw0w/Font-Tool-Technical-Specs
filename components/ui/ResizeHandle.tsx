import React from 'react';
import clsx from 'clsx';

interface ResizeHandleProps {
  onDrag: (deltaX: number) => void;
  className?: string;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onDrag, className }) => {
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    let lastX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - lastX;
      onDrag(deltaX);
      lastX = moveEvent.clientX;
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      className={clsx(
        "group w-1 flex-shrink-0 cursor-col-resize flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors duration-200",
        className
      )}
      onMouseDown={handleMouseDown}
    >
      <div className="w-0.5 h-full bg-gray-300 group-hover:bg-blue-500 transition-colors duration-200" />
    </div>
  );
};

export default ResizeHandle;