import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HabitCard } from '@/components/habit-card';
import { AddHabitModal } from '@/components/add-habit-modal';
import { HabitWithCompletions } from '@shared/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function Today() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [habitToEdit, setHabitToEdit] = useState<HabitWithCompletions | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Fetch habits
  const { data: habits, isLoading, error } = useQuery({
    queryKey: ['/api/habits'],
  });
  
  // Handle edit habit
  const handleEditHabit = (habit: HabitWithCompletions) => {
    setHabitToEdit(habit);
    setIsEditModalOpen(true);
  };
  
  // Filter and sort habits
  const filteredHabits = React.useMemo(() => {
    if (!habits) return [];
    
    let filtered = [...habits];
    
    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(habit => habit.category === categoryFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "streak":
          return b.currentStreak - a.currentStreak;
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [habits, categoryFilter, sortBy]);
  
  // Extract unique categories for filter dropdown
  const categories = React.useMemo(() => {
    if (!habits) return [];
    const uniqueCategories = new Set(habits.map(habit => habit.category));
    return Array.from(uniqueCategories);
  }, [habits]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Today's Habits</h2>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-red-800">
        <h2 className="text-lg font-medium mb-2">Error loading habits</h2>
        <p>There was a problem loading your habits. Please try again later.</p>
      </div>
    );
  }
  
  // Empty state
  if (habits && habits.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">No habits yet</h2>
        <p className="text-gray-600 mb-6">Start tracking your habits by adding your first one!</p>
      </div>
    );
  }
  
  // If we have filtered out all habits
  if (filteredHabits.length === 0 && categoryFilter !== "all") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Today's Habits</h2>
          <div className="flex space-x-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="streak">Sort by Streak</SelectItem>
                <SelectItem value="category">Sort by Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="text-center py-8">
          <p className="text-gray-600">No habits found in this category.</p>
        </div>
      </div>
    );
  }
  
  // Main content
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Today's Habits</h2>
        <div className="flex space-x-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="streak">Sort by Streak</SelectItem>
              <SelectItem value="category">Sort by Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredHabits.map(habit => (
          <HabitCard key={habit.id} habit={habit} onEdit={handleEditHabit} />
        ))}
      </div>
      
      <AddHabitModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
        habitToEdit={habitToEdit} 
      />
    </div>
  );
}
