import React from 'react';

interface ProgressCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  onClick?: () => void;
}

export function ProgressCircle({
  percentage,
  size = 64,
  strokeWidth = 2,
  color,
  onClick
}: ProgressCircleProps) {
  // Calculate the appropriate color based on percentage
  const getColor = () => {
    if (color) return color;
    if (percentage >= 100) return 'hsl(var(--secondary))';
    if (percentage >= 50) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  // Calculate circle properties
  const radius = size / 2 - strokeWidth;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          fill="none" 
          stroke="hsl(var(--muted))" 
          strokeWidth={strokeWidth} 
        />
        
        {/* Progress circle */}
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          fill="none" 
          stroke={getColor()} 
          strokeWidth={strokeWidth} 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          transform={`rotate(-90 ${size/2} ${size/2})`}
          className="transition-all duration-300 ease-in-out"
        />
        
        {/* Percentage text */}
        <text 
          x={size/2} 
          y={size/2} 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fill={getColor()} 
          fontSize={size/4} 
          fontWeight="bold"
        >
          {percentage}%
        </text>
      </svg>

      {onClick && (
        <button 
          onClick={onClick}
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-80 rounded-full focus:outline-none"
          aria-label="Mark as complete"
        >
          <span className="material-icons text-secondary">check_circle</span>
        </button>
      )}
    </div>
  );
}
