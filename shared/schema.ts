import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (keeping from original file)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define habit schema
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  userId: integer("user_id").notNull(),
  frequency: text("frequency").notNull().default("daily"),
  daysOfWeek: json("days_of_week").$type<number[]>().notNull().default([0, 1, 2, 3, 4, 5, 6]),
  reminderTime: text("reminder_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  createdAt: true,
});

export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habits.$inferSelect;

// Define habit completion tracking
export const habitCompletions = pgTable("habit_completions", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull(),
  date: text("date").notNull(), // format: YYYY-MM-DD
  completed: boolean("completed").notNull().default(false),
  completionPercentage: integer("completion_percentage").notNull().default(0),
});

export const insertHabitCompletionSchema = createInsertSchema(habitCompletions).omit({
  id: true,
});

export type InsertHabitCompletion = z.infer<typeof insertHabitCompletionSchema>;
export type HabitCompletion = typeof habitCompletions.$inferSelect;

// Extended types for frontend
export type HabitWithCompletions = Habit & {
  completions: HabitCompletion[];
  streak: number;
  currentStreak: number;
  longestStreak: number;
};
