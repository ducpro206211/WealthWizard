import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  expenses, type Expense, type InsertExpense,
  budgets, type Budget, type InsertBudget
} from "@shared/schema";
import { format } from "date-fns";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Expense methods
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpensesByUserId(userId: number): Promise<Expense[]>;
  getExpensesByUserIdAndMonth(userId: number, month: number, year: number): Promise<Expense[]>;
  getRecentExpensesByUserId(userId: number, limit: number): Promise<Expense[]>;
  
  // Budget methods
  getBudgetByUserIdAndMonth(userId: number, month: number, year: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, amount: number): Promise<Budget | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private expenses: Map<number, Expense>;
  private budgets: Map<number, Budget>;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private expenseIdCounter: number;
  private budgetIdCounter: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.expenses = new Map();
    this.budgets = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.expenseIdCounter = 1;
    this.budgetIdCounter = 1;
    
    // Initialize with default categories
    this.initializeDefaultCategories();
  }
  
  private initializeDefaultCategories() {
    const defaultCategories = [
      { name: "Food", icon: "restaurant", color: "blue" },
      { name: "Transport", icon: "directions_car", color: "indigo" },
      { name: "Entertainment", icon: "celebration", color: "purple" },
      { name: "Groceries", icon: "shopping_basket", color: "green" },
      { name: "Utilities", icon: "bolt", color: "yellow" },
      { name: "Housing", icon: "home", color: "orange" },
      { name: "Healthcare", icon: "local_hospital", color: "red" },
      { name: "Shopping", icon: "shopping_bag", color: "pink" },
      { name: "Other", icon: "more_horiz", color: "gray" }
    ];
    
    defaultCategories.forEach(cat => {
      const id = this.categoryIdCounter++;
      this.categories.set(id, {
        id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color
      });
    });
  }

  // User methods
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
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryByName(name: string): Promise<Category | undefined> {
    // Case insensitive search
    const normalizedName = name.toLowerCase().trim();
    return Array.from(this.categories.values()).find(
      category => category.name.toLowerCase() === normalizedName
    );
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  // Expense methods
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.expenseIdCounter++;
    // Ensure all required fields have values
    const newExpense: Expense = { 
      ...expense, 
      id,
      date: expense.date || new Date(),
      description: expense.description || null,
      location: expense.location || null,
      currency: expense.currency || "VND",
      userId: expense.userId || null,
      categoryId: expense.categoryId || null
    };
    this.expenses.set(id, newExpense);
    return newExpense;
  }
  
  async getExpensesByUserId(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      expense => expense.userId === userId
    );
  }
  
  async getExpensesByUserIdAndMonth(userId: number, month: number, year: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => {
      if (!expense.userId || expense.userId !== userId) return false;
      
      const expenseDate = expense.date instanceof Date 
        ? expense.date 
        : new Date(expense.date);
      
      return expenseDate.getMonth() + 1 === month && expenseDate.getFullYear() === year;
    });
  }
  
  async getRecentExpensesByUserId(userId: number, limit: number): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.userId === userId)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  }
  
  // Budget methods
  async getBudgetByUserIdAndMonth(userId: number, month: number, year: number): Promise<Budget | undefined> {
    return Array.from(this.budgets.values()).find(
      budget => budget.userId === userId && budget.month === month && budget.year === year
    );
  }
  
  async createBudget(budget: InsertBudget): Promise<Budget> {
    const id = this.budgetIdCounter++;
    // Ensure all required fields have values
    const newBudget: Budget = { 
      ...budget, 
      id,
      userId: budget.userId || null,
      amount: budget.amount,
      month: budget.month,
      year: budget.year
    };
    this.budgets.set(id, newBudget);
    return newBudget;
  }
  
  async updateBudget(id: number, amount: number): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;
    
    const updatedBudget: Budget = { ...budget, amount };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }
}

export const storage = new MemStorage();
