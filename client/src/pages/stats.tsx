import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Book, Activity, Brain, Coffee } from 'lucide-react';

export default function Stats() {
  const [timePeriod, setTimePeriod] = useState('7days');
  
  // Fetch stats data
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/stats?period=${timePeriod}`],
  });
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Statistics</h2>
          <Skeleton className="h-9 w-40" />
        </div>
        
        <Skeleton className="h-48 w-full rounded-lg" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }
  
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'health':
        return <Activity className="text-blue-600" />;
      case 'learning':
        return <Book className="text-purple-600" />;
      case 'mindfulness':
        return <Brain className="text-green-600" />;
      case 'productivity':
        return <Coffee className="text-yellow-600" />;
      default:
        return <Activity />;
    }
  };
  
  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'health': return 'bg-blue-500';
      case 'learning': return 'bg-purple-500';
      case 'mindfulness': return 'bg-green-500';
      case 'productivity': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Statistics</h2>
        <div>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Overall Progress Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Overall Progress</h3>
          
          <div className="flex flex-col md:flex-row md:space-x-8 space-y-4 md:space-y-0">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {(stats?.overallStats?.totalCompletionRate ?? 0).toFixed(0)}%
                </span>
              </div>
              <Progress value={stats?.overallStats?.totalCompletionRate ?? 0} className="h-2" />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-600">Longest Streak</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats?.overallStats?.longestStreak ?? 0} days
                </span>
              </div>
              <Progress value={stats?.overallStats?.longestStreak ?? 0} max={30} className="h-2 bg-primary" />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-600">Current Streaks</span>
                <span className="text-sm font-medium text-gray-900">
                  {(stats?.overallStats?.averageStreak ?? 0).toFixed(1)} days avg.
                </span>
              </div>
              <Progress value={stats?.overallStats?.averageStreak ?? 0} max={30} className="h-2 bg-warning" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Habit Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion By Category */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Completion by Category</h3>
            <div className="space-y-4">
              {stats?.categoryStats?.map((categoryStat: any) => (
                <div key={categoryStat.category}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-600">{categoryStat.category}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(categoryStat.averageCompletionRate ?? 0).toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={categoryStat.averageCompletionRate ?? 0} 
                    className={`h-2 ${getCategoryColor(categoryStat.category)}`}
                  />
                </div>
              ))}
              
              {(!stats?.categoryStats || stats.categoryStats.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No category data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Top Habits */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Best Performing Habits</h3>
            <div className="space-y-4">
              {stats?.topHabits?.map((habit: any) => (
                <div key={habit.habitId} className="flex items-center">
                  <div className="w-8 h-8 bg-opacity-20 rounded-full flex items-center justify-center mr-3" 
                    style={{backgroundColor: `${getCategoryColor(habit.category)}30`}}>
                    {getCategoryIcon(habit.category)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{habit.name}</span>
                      <span className="text-sm font-medium text-green-600">
                        {(habit.completionRate ?? 0).toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={habit.completionRate ?? 0} 
                      className={`h-1 mt-1 ${getCategoryColor(habit.category)}`}
                    />
                  </div>
                </div>
              ))}
              
              {(!stats?.topHabits || stats.topHabits.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No habit performance data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
