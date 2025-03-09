import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { HabitWithCompletions } from '@shared/schema';

interface AddHabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habitToEdit?: HabitWithCompletions;
}

export function AddHabitModal({ open, onOpenChange, habitToEdit }: AddHabitModalProps) {
  const { toast } = useToast();
  const isEditing = !!habitToEdit;
  
  // Form state
  const [name, setName] = useState(habitToEdit?.name || '');
  const [category, setCategory] = useState(habitToEdit?.category || '');
  const [frequency, setFrequency] = useState(habitToEdit?.frequency || 'daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(habitToEdit?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
  const [reminderTime, setReminderTime] = useState(habitToEdit?.reminderTime || '');
  const [notes, setNotes] = useState(habitToEdit?.notes || '');
  
  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (open && habitToEdit) {
      setName(habitToEdit.name);
      setCategory(habitToEdit.category);
      setFrequency(habitToEdit.frequency);
      setDaysOfWeek(habitToEdit.daysOfWeek);
      setReminderTime(habitToEdit.reminderTime || '');
      setNotes(habitToEdit.notes || '');
    } else if (!open) {
      // Reset form when closed
      setName('');
      setCategory('');
      setFrequency('daily');
      setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
      setReminderTime('');
      setNotes('');
    }
  }, [open, habitToEdit]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name) {
      toast({
        title: 'Error',
        description: 'Habit name is required',
        variant: 'destructive',
      });
      return;
    }
    
    if (!category) {
      toast({
        title: 'Error',
        description: 'Category is required',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const habitData = {
        name,
        category,
        frequency,
        daysOfWeek,
        reminderTime: reminderTime || undefined,
        notes: notes || undefined,
        userId: 1, // Hardcoded for simplicity
      };
      
      if (isEditing && habitToEdit) {
        await apiRequest('PUT', `/api/habits/${habitToEdit.id}`, habitData);
        toast({
          title: 'Habit updated',
          description: `${name} has been updated successfully`,
        });
      } else {
        await apiRequest('POST', '/api/habits', habitData);
        toast({
          title: 'Habit created',
          description: `${name} has been created successfully`,
        });
      }
      
      // Refresh habits data
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
      
      // Close the modal
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} habit`,
        variant: 'destructive',
      });
    }
  };
  
  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Habit' : 'Add New Habit'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of your habit.' : 'Create a new habit to track daily or weekly.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="habit-name" className="text-sm">Habit Name</Label>
            <Input 
              id="habit-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g., Morning Workout" 
              className="h-8 mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="habit-category" className="text-sm">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="habit-category" className="h-8 mt-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Productivity">Productivity</SelectItem>
                <SelectItem value="Learning">Learning</SelectItem>
                <SelectItem value="Mindfulness">Mindfulness</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm">Frequency</Label>
            <div className="flex space-x-2 mt-1">
              <Button 
                type="button" 
                variant={frequency === 'daily' ? 'default' : 'outline'} 
                onClick={() => setFrequency('daily')}
                size="sm"
                className="h-7 text-xs px-2"
              >
                Daily
              </Button>
              <Button 
                type="button" 
                variant={frequency === 'weekly' ? 'default' : 'outline'} 
                onClick={() => setFrequency('weekly')}
                size="sm"
                className="h-7 text-xs px-2"
              >
                Weekly
              </Button>
              <Button 
                type="button" 
                variant={frequency === 'custom' ? 'default' : 'outline'} 
                onClick={() => setFrequency('custom')}
                size="sm"
                className="h-7 text-xs px-2"
              >
                Custom
              </Button>
            </div>
          </div>
          
          <div>
            <Label className="text-sm">Days of Week</Label>
            <div className="flex justify-between mt-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Toggle
                  key={index}
                  pressed={daysOfWeek.includes(index)}
                  onPressedChange={() => toggleDay(index)}
                  className="w-7 h-7 rounded-full p-0 text-xs"
                >
                  {day}
                </Toggle>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="habit-reminder" className="text-sm">Reminder Time (Optional)</Label>
            <Input 
              id="habit-reminder" 
              type="time" 
              value={reminderTime} 
              onChange={(e) => setReminderTime(e.target.value)} 
              className="h-8 mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="habit-notes" className="text-sm">Notes (Optional)</Label>
            <Textarea 
              id="habit-notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Any additional details..." 
              rows={1}
              className="min-h-[40px] mt-1"
            />
          </div>
          
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-8 text-sm">
              Cancel
            </Button>
            <Button type="submit" className="h-8 text-sm">{isEditing ? 'Update' : 'Create'} Habit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
