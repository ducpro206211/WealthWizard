import { Expense, Category, Budget, User } from "@shared/schema";

export type CategoryWithStats = Category & {
  amount: number;
  percentage: number;
}

export type MonthlyExpenseSummary = {
  totalAmount: number;
  categories: CategoryWithStats[];
  month: number;
  year: number;
}

export type ChatMessage = {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  expense?: Expense & {
    category?: Category;
  };
  summaryData?: MonthlyExpenseSummary;
  insights?: string[];
}

export type ExpenseTrend = {
  day: number;
  amount: number;
}

export type Currency = 'VND' | 'USD' | 'EUR';
