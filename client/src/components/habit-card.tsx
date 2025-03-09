import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressCircle } from '@/components/ui/progress-circle';
import { StreakDots } from '@/components/ui/streak-dots';
import { HabitWithCompletions } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface HabitCardProps {
  habit: HabitWithCompletions;
  onEdit: (habit: HabitWithCompletions) => void;
}

export function HabitCard({ habit, onEdit }: HabitCardProps) {
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Find today's completion status
  const todayCompletion = habit.completions.find(c => c.date === today) || {
    id: 0,
    habitId: habit.id,
    date: today,
    completed: false,
    completionPercentage: 0
  };
  
  const handleToggleCompletion = async () => {
    try {
      // Toggle between 0, 50, and 100%
      let newPercentage = 0;
      if (todayCompletion.completionPercentage === 0) newPercentage = 50;
      else if (todayCompletion.completionPercentage === 50) newPercentage = 100;
      else newPercentage = 0;
      
      const completed = newPercentage === 100;
      
      await apiRequest('POST', `/api/habits/${habit.id}/completions`, {
        date: today,
        completed,
        completionPercentage: newPercentage
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
      
      toast({
        title: `Habit ${completed ? 'completed' : 'updated'}`,
        description: `${habit.name} marked as ${newPercentage}% complete`,
      });
    } catch (error) {
      toast({
        title: 'Error updating habit',
        description: 'Failed to update habit completion status',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteHabit = async () => {
    if (!confirm(`Are you sure you want to delete "${habit.name}"?`)) {
      return;
    }
    
    try {
      await apiRequest('DELETE', `/api/habits/${habit.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
      
      toast({
        title: 'Habit deleted',
        description: `${habit.name} has been removed`,
      });
    } catch (error) {
      toast({
        title: 'Error deleting habit',
        description: 'Failed to delete habit',
        variant: 'destructive',
      });
    }
  };

  const getCategoryColorClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'health': return 'bg-blue-100 text-blue-800';
      case 'learning': return 'bg-purple-100 text-purple-800';
      case 'mindfulness': return 'bg-green-100 text-green-800';
      case 'productivity': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-4 flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{habit.name}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColorClass(habit.category)}`}>
            {habit.category}
          </span>
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(habit)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDeleteHabit}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-gray-500">Current streak</div>
          <div className="font-bold text-xl">{habit.currentStreak} days</div>
        </div>
        <ProgressCircle 
          percentage={todayCompletion.completionPercentage} 
          onClick={handleToggleCompletion} 
        />
      </div>
      
      <div className="mt-auto">
        <StreakDots completions={habit.completions} />
      </div>
    </Card>
  );
}
