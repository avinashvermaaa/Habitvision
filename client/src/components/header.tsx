import React from 'react';
import { Button } from '@/components/ui/button';
import { UserCircle, Plus } from 'lucide-react';

interface HeaderProps {
  onAddHabit: () => void;
}

export default function Header({ onAddHabit }: HeaderProps) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">HabitFlow</h1>
        <div className="flex items-center space-x-4">
          {/* User profile button */}
          <Button variant="ghost" size="icon" className="rounded-full">
            <UserCircle className="h-6 w-6" />
          </Button>
          
          {/* Add habit button */}
          <Button onClick={onAddHabit} className="flex items-center">
            <Plus className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">Add Habit</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
