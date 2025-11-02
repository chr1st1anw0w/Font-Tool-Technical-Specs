import React from 'react';

const ChristianWuLogo: React.FC<{className?: string}> = ({ className }) => (
    <svg 
        className={className}
        viewBox="0 0 140 20" 
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
    >
        <text 
            x="0" 
            y="15" 
            fontFamily="DM Sans, sans-serif" 
            fontSize="16" 
            fontWeight="bold"
        >
            Christian Wu
        </text>
    </svg>
);

export default ChristianWuLogo;