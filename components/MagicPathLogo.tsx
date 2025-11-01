import React from 'react';

const MagicPathLogo: React.FC<{className?: string}> = ({ className }) => (
    <svg 
        className={className}
        viewBox="0 0 100 20" 
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
            MagicPath
        </text>
    </svg>
);

export default MagicPathLogo;
