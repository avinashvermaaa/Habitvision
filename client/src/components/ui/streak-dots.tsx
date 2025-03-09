import React from 'react';
import { HabitCompletion } from '@shared/schema';
import { cn } from '@/lib/utils';

interface StreakDotsProps {
  completions: HabitCompletion[];
  className?: string;
}

export function StreakDots({ completions, className }: StreakDotsProps) {
  // Helper function to get the color class based on completion status
  const getDotColorClass = (completion: HabitCompletion) => {
    if (!completion || completion.completionPercentage === 0) return 'bg-gray-300';
    if (completion.completionPercentage === 100) return 'bg-secondary';
    if (completion.completionPercentage >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className={cn('flex space-x-1 items-center', className)}>
      {completions.map((completion, index) => (
        <div 
          key={index} 
          className={cn(
            'streak-dot w-2 h-2 rounded-full', 
            getDotColorClass(completion)
          )}
          title={`${completion.date}: ${completion.completionPercentage}% completed`}
        />
      ))}
    </div>
  );
}
