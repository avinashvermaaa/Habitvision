import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Habit } from '@shared/schema';

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHabit, setSelectedHabit] = useState<string>("all");
  
  // Format month for API call
  const monthStr = format(currentMonth, 'MM');
  const yearStr = format(currentMonth, 'yyyy');
  
  // Fetch calendar data
  const { data: calendarData, isLoading } = useQuery({
    queryKey: [`/api/calendar?month=${monthStr}&year=${yearStr}`],
  });
  
  // Fetch all habits for the dropdown
  const { data: habits } = useQuery({
    queryKey: ['/api/habits'],
  });
  
  // Go to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };
  
  // Go to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };
  
  // Generate calendar days
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = monthStart;
    const endDate = monthEnd;
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Fill in days from previous month to start on Sunday
    const firstDayOfMonth = getDay(monthStart);
    const prevMonthDays = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      prevMonthDays.push(null);
    }
    
    return [...prevMonthDays, ...days];
  }, [currentMonth]);
  
  // Get color for habit completion dot
  const getCompletionColor = (habitId: number, dateStr: string) => {
    if (!calendarData) return 'bg-gray-300';
    
    const habitData = calendarData.find(data => data.habitId === habitId);
    if (!habitData) return 'bg-gray-300';
    
    const completion = habitData.completions.find(c => c.date === dateStr);
    if (!completion) return 'bg-gray-300';
    
    if (completion.completed) return 'bg-secondary';
    if (completion.completionPercentage >= 50) return 'bg-warning';
    if (completion.completionPercentage > 0) return 'bg-danger';
    return 'bg-gray-300';
  };
  
  // Filter habits based on selection
  const filteredHabits = React.useMemo(() => {
    if (!calendarData) return [];
    if (selectedHabit === "all") return calendarData;
    return calendarData.filter(data => data.habitId.toString() === selectedHabit);
  }, [calendarData, selectedHabit]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Calendar View</h2>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
        
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Calendar View</h2>
        <div className="flex space-x-2">
          <Select value={selectedHabit} onValueChange={setSelectedHabit}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Habits" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Habits</SelectItem>
              {habits && habits.map((habit: Habit) => (
                <SelectItem key={habit.id} value={habit.id.toString()}>{habit.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center bg-white border border-gray-300 rounded-md">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500">{day}</div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                // Empty cell for padding
                return (
                  <div key={`empty-${index}`} className="p-1 bg-gray-100 text-gray-400 rounded aspect-square" />
                );
              }
              
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayNum = format(day, 'd');
              const isCurrentMonth = isSameMonth(day, currentMonth);
              
              return (
                <div 
                  key={dayStr}
                  className={`p-1 ${isCurrentMonth ? 'bg-white border border-gray-200' : 'bg-gray-100 text-gray-400'} rounded aspect-square`}
                >
                  <div className="text-xs mb-1">{dayNum}</div>
                  <div className="flex flex-wrap gap-1">
                    {filteredHabits.slice(0, 3).map(habit => (
                      <div 
                        key={`${dayStr}-${habit.habitId}`} 
                        className={`w-2 h-2 rounded-full ${getCompletionColor(habit.habitId, dayStr)}`}
                        title={`${habit.name}: ${dayStr}`}
                      />
                    ))}
                    {filteredHabits.length > 3 && (
                      <div className="w-2 h-2 rounded-full bg-gray-400" title="More habits..." />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Calendar Legend */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-secondary mr-2"></div>
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-warning mr-2"></div>
              <span className="text-sm">Partially completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-danger mr-2"></div>
              <span className="text-sm">Missed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
              <span className="text-sm">Not scheduled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
