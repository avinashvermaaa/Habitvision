import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { format, subDays } from "date-fns";
import { insertHabitSchema, insertHabitCompletionSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Render deployment
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  const apiRouter = express.Router();
  
  // Habits
  apiRouter.get("/habits", async (req, res) => {
    try {
      // For simplicity, use hardcoded userId 1 (normally would come from session)
      const userId = 1;
      const habits = await storage.getAllHabits(userId);
      
      // For each habit, get completions and calculate streaks
      const habitsWithCompletions = await Promise.all(
        habits.map(async (habit) => {
          const completions = await storage.getCompletionsForHabit(habit.id);
          const { streak } = await storage.getHabitStats(habit.id);
          
          // Get completions for last 7 days to show streak dots
          const today = new Date();
          const lastWeekCompletions = [];
          
          for (let i = 6; i >= 0; i--) {
            const date = format(subDays(today, i), 'yyyy-MM-dd');
            const completion = await storage.getHabitCompletionsByDate(habit.id, date);
            
            if (completion) {
              lastWeekCompletions.push(completion);
            } else {
              // Add an empty completion record
              lastWeekCompletions.push({
                id: 0,
                habitId: habit.id,
                date,
                completed: false,
                completionPercentage: 0
              });
            }
          }
          
          return {
            ...habit,
            completions: lastWeekCompletions,
            streak,
            currentStreak: streak,
            // For simplicity, using the same streak value
            longestStreak: streak,
          };
        })
      );
      
      res.json(habitsWithCompletions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });
  
  apiRouter.post("/habits", async (req, res) => {
    try {
      // Validate request body
      const habitData = insertHabitSchema.parse(req.body);
      
      // Create habit
      const habit = await storage.createHabit(habitData);
      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid habit data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create habit" });
      }
    }
  });
  
  apiRouter.get("/habits/:id", async (req, res) => {
    try {
      const habitId = parseInt(req.params.id);
      const habit = await storage.getHabit(habitId);
      
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      
      const completions = await storage.getCompletionsForHabit(habitId);
      const { streak } = await storage.getHabitStats(habitId);
      
      res.json({
        ...habit,
        completions,
        streak,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habit" });
    }
  });
  
  apiRouter.put("/habits/:id", async (req, res) => {
    try {
      const habitId = parseInt(req.params.id);
      const habitData = insertHabitSchema.partial().parse(req.body);
      
      const updatedHabit = await storage.updateHabit(habitId, habitData);
      
      if (!updatedHabit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      
      res.json(updatedHabit);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid habit data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update habit" });
      }
    }
  });
  
  apiRouter.delete("/habits/:id", async (req, res) => {
    try {
      const habitId = parseInt(req.params.id);
      const deleted = await storage.deleteHabit(habitId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Habit not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete habit" });
    }
  });
  
  // Habit Completions
  apiRouter.post("/habits/:habitId/completions", async (req, res) => {
    try {
      const habitId = parseInt(req.params.habitId);
      const completionData = insertHabitCompletionSchema.parse({
        ...req.body,
        habitId,
      });
      
      const completion = await storage.trackHabitCompletion(completionData);
      res.status(201).json(completion);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid completion data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to track habit completion" });
      }
    }
  });
  
  apiRouter.get("/habits/:habitId/completions", async (req, res) => {
    try {
      const habitId = parseInt(req.params.habitId);
      const { startDate, endDate } = req.query;
      
      if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
        const completions = await storage.getHabitCompletionsByDateRange(
          habitId,
          startDate,
          endDate
        );
        return res.json(completions);
      }
      
      const completions = await storage.getCompletionsForHabit(habitId);
      res.json(completions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch completions" });
    }
  });
  
  // Calendar data
  apiRouter.get("/calendar", async (req, res) => {
    try {
      const { month, year } = req.query;
      const userId = 1; // Hardcoded for simplicity
      
      if (!month || !year || typeof month !== 'string' || typeof year !== 'string') {
        return res.status(400).json({ message: "Month and year are required" });
      }
      
      // Get all habits for the user
      const habits = await storage.getAllHabits(userId);
      
      // Calculate the start and end dates for the month
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-31`; // This works even if the month doesn't have 31 days
      
      // For each habit, get completions for the month
      const calendarData = await Promise.all(
        habits.map(async (habit) => {
          const completions = await storage.getHabitCompletionsByDateRange(
            habit.id,
            startDate,
            endDate
          );
          
          return {
            habitId: habit.id,
            name: habit.name,
            category: habit.category,
            completions,
          };
        })
      );
      
      res.json(calendarData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calendar data" });
    }
  });
  
  // Stats data
  apiRouter.get("/stats", async (req, res) => {
    try {
      const userId = 1; // Hardcoded for simplicity
      const { period } = req.query;
      
      // Get all habits for the user
      const habits = await storage.getAllHabits(userId);
      
      // For each habit, calculate stats
      const habitStats = await Promise.all(
        habits.map(async (habit) => {
          const { streak, completionRate } = await storage.getHabitStats(habit.id);
          
          return {
            habitId: habit.id,
            name: habit.name,
            category: habit.category,
            streak,
            completionRate,
          };
        })
      );
      
      // Group habits by category
      const categoryStats = habitStats.reduce((acc, stat) => {
        const { category } = stat;
        if (!acc[category]) {
          acc[category] = {
            category,
            habits: [],
            averageCompletionRate: 0,
          };
        }
        
        acc[category].habits.push(stat);
        return acc;
      }, {} as Record<string, { category: string, habits: typeof habitStats, averageCompletionRate: number }>);
      
      // Calculate average completion rate for each category
      Object.values(categoryStats).forEach(categoryStat => {
        const totalRate = categoryStat.habits.reduce((sum, habit) => sum + habit.completionRate, 0);
        categoryStat.averageCompletionRate = totalRate / categoryStat.habits.length;
      });
      
      // Get top performing habits
      const topHabits = [...habitStats].sort((a, b) => b.completionRate - a.completionRate).slice(0, 3);
      
      // Calculate overall stats
      const totalCompletionRate = habitStats.reduce((sum, habit) => sum + habit.completionRate, 0) / habitStats.length;
      const longestStreak = Math.max(...habitStats.map(habit => habit.streak), 0);
      const averageStreak = habitStats.reduce((sum, habit) => sum + habit.streak, 0) / habitStats.length;
      
      res.json({
        overallStats: {
          totalCompletionRate,
          longestStreak,
          averageStreak,
        },
        categoryStats: Object.values(categoryStats),
        topHabits,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  
  // Initialize storage with a demo user
  const users = await storage.getUserByUsername("demo");
  if (!users) {
    await storage.createUser({
      username: "demo",
      password: "demo123"
    });
  }

  return httpServer;
}
