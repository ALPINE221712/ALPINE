import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = 'h-7 w-auto', showText = true }) => {
  return (
    <div className="flex items-center gap-2.5">
      <svg className={className} viewBox="0 0 160 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="6" width="24" height="24" rx="4" fill="#0F172A" />
        <path d="M7 13h14M7 18h14M7 23h9" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        <rect x="18" y="20" width="6" height="6" rx="1.5" fill="#2563EB" />
        {showText && (
          <text
            x="34"
            y="24"
            fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize="17"
            fontWeight="700"
            fill="#0F172A"
            letterSpacing="-0.02em"
          >
            Stock<tspan fill="#2563EB">Sense</tspan>
          </text>
        )}
      </svg>
    </div>
  );
};
