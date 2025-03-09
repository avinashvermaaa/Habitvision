import { habits, type Habit, type InsertHabit, habitCompletions, type HabitCompletion, type InsertHabitCompletion, users, type User, type InsertUser } from "@shared/schema";
import { format, subDays, parse, isToday, isYesterday, isThisWeek, parseISO } from "date-fns";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations (keeping from original file)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Habit operations
  createHabit(habit: InsertHabit): Promise<Habit>;
  getHabit(id: number): Promise<Habit | undefined>;
  getAllHabits(userId: number): Promise<Habit[]>;
  updateHabit(id: number, habit: Partial<InsertHabit>): Promise<Habit | undefined>;
  deleteHabit(id: number): Promise<boolean>;
  
  // Habit completion operations
  trackHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion>;
  getHabitCompletionsByDate(habitId: number, date: string): Promise<HabitCompletion | undefined>;
  getCompletionsForHabit(habitId: number): Promise<HabitCompletion[]>;
  getHabitCompletionsByDateRange(habitId: number, startDate: string, endDate: string): Promise<HabitCompletion[]>;
  getCompletionsByUserIdAndDate(userId: number, date: string): Promise<{habitId: number, completion: HabitCompletion}[]>;
  
  // Stats operations
  getHabitStats(habitId: number): Promise<{streak: number, completionRate: number}>;
  getCurrentStreak(habitId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private habits: Map<number, Habit>;
  private habitCompletions: Map<number, HabitCompletion>;
  private userIdCounter: number;
  private habitIdCounter: number;
  private completionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.habits = new Map();
    this.habitCompletions = new Map();
    this.userIdCounter = 1;
    this.habitIdCounter = 1;
    this.completionIdCounter = 1;
  }

  // User operations (keeping from original file)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Habit operations
  async createHabit(insertHabit: InsertHabit): Promise<Habit> {
    const id = this.habitIdCounter++;
    const now = new Date();
    const habit: Habit = { 
      ...insertHabit, 
      id, 
      createdAt: now 
    };
    this.habits.set(id, habit);
    return habit;
  }

  async getHabit(id: number): Promise<Habit | undefined> {
    return this.habits.get(id);
  }

  async getAllHabits(userId: number): Promise<Habit[]> {
    return Array.from(this.habits.values()).filter(
      habit => habit.userId === userId
    );
  }

  async updateHabit(id: number, habitUpdate: Partial<InsertHabit>): Promise<Habit | undefined> {
    const habit = this.habits.get(id);
    if (!habit) return undefined;
    
    const updatedHabit: Habit = {
      ...habit,
      ...habitUpdate,
    };
    
    this.habits.set(id, updatedHabit);
    return updatedHabit;
  }

  async deleteHabit(id: number): Promise<boolean> {
    // Delete all completions for this habit
    Array.from(this.habitCompletions.entries())
      .filter(([_, completion]) => completion.habitId === id)
      .forEach(([completionId, _]) => this.habitCompletions.delete(completionId));
    
    return this.habits.delete(id);
  }

  // Habit completion operations
  async trackHabitCompletion(insertCompletion: InsertHabitCompletion): Promise<HabitCompletion> {
    // Check if completion already exists for this habit and date
    const existing = await this.getHabitCompletionsByDate(insertCompletion.habitId, insertCompletion.date);
    
    if (existing) {
      // Update existing completion
      const updatedCompletion = {
        ...existing,
        completed: insertCompletion.completed,
        completionPercentage: insertCompletion.completionPercentage,
      };
      this.habitCompletions.set(existing.id, updatedCompletion);
      return updatedCompletion;
    } else {
      // Create new completion
      const id = this.completionIdCounter++;
      const completion: HabitCompletion = { ...insertCompletion, id };
      this.habitCompletions.set(id, completion);
      return completion;
    }
  }

  async getHabitCompletionsByDate(habitId: number, date: string): Promise<HabitCompletion | undefined> {
    return Array.from(this.habitCompletions.values()).find(
      completion => completion.habitId === habitId && completion.date === date
    );
  }

  async getCompletionsForHabit(habitId: number): Promise<HabitCompletion[]> {
    return Array.from(this.habitCompletions.values())
      .filter(completion => completion.habitId === habitId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getHabitCompletionsByDateRange(habitId: number, startDate: string, endDate: string): Promise<HabitCompletion[]> {
    return Array.from(this.habitCompletions.values())
      .filter(completion => {
        return completion.habitId === habitId && 
               completion.date >= startDate && 
               completion.date <= endDate;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getCompletionsByUserIdAndDate(userId: number, date: string): Promise<{habitId: number, completion: HabitCompletion}[]> {
    // Get all habits for the user
    const userHabits = await this.getAllHabits(userId);
    
    // Find all completions for these habits on the given date
    const results: {habitId: number, completion: HabitCompletion}[] = [];
    
    for (const habit of userHabits) {
      const completion = await this.getHabitCompletionsByDate(habit.id, date);
      if (completion) {
        results.push({ habitId: habit.id, completion });
      }
    }
    
    return results;
  }

  // Helper to calculate streaks and stats
  async getHabitStats(habitId: number): Promise<{streak: number, completionRate: number}> {
    const completions = await this.getCompletionsForHabit(habitId);
    if (completions.length === 0) {
      return { streak: 0, completionRate: 0 };
    }

    // Calculate current streak
    const streak = await this.getCurrentStreak(habitId);
    
    // Calculate completion rate (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const thirtyDaysAgoStr = format(thirtyDaysAgo, 'yyyy-MM-dd');
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const last30DaysCompletions = await this.getHabitCompletionsByDateRange(
      habitId, 
      thirtyDaysAgoStr, 
      todayStr
    );
    
    const completedDays = last30DaysCompletions.filter(c => c.completed).length;
    const completionRate = completedDays / 30 * 100;
    
    return { streak, completionRate };
  }

  async getCurrentStreak(habitId: number): Promise<number> {
    const completions = await this.getCompletionsForHabit(habitId);
    if (completions.length === 0) return 0;
    
    // Sort by date in descending order
    completions.sort((a, b) => b.date.localeCompare(a.date));
    
    let streak = 0;
    let currentDate = new Date();
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    
    // Check if today is completed
    const todayCompletion = completions.find(c => c.date === todayStr);
    if (!todayCompletion || !todayCompletion.completed) {
      // Check yesterday instead
      currentDate = subDays(currentDate, 1);
    }
    
    // Count consecutive days with completed habits
    let checkDate = format(currentDate, 'yyyy-MM-dd');
    
    for (let i = 0; i < completions.length; i++) {
      const completion = completions.find(c => c.date === checkDate);
      
      if (!completion || !completion.completed) {
        break;
      }
      
      streak++;
      currentDate = subDays(currentDate, 1);
      checkDate = format(currentDate, 'yyyy-MM-dd');
    }
    
    return streak;
  }
}

export const storage = new MemStorage();
