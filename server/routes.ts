import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { extractExpenseFromText, getMonthlyInsights } from "./services/gemini";
import { 
  insertExpenseSchema, 
  insertBudgetSchema, 
  insertUserSchema,
  insertCategorySchema
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api
  
  // Handle validation errors
  const handleValidationError = (error: unknown, res: Response) => {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  };

  // User routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      handleValidationError(error, res);
    }
  });
  
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // For the MVP, we're not implementing proper session handling
      // Just returning the user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      handleValidationError(error, res);
    }
  });
  
  // Category routes
  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Expense routes
  app.post("/api/expenses", async (req: Request, res: Response) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      handleValidationError(error, res);
    }
  });
  
  app.get("/api/expenses/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const expenses = await storage.getExpensesByUserId(userId);
      res.json(expenses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/expenses/recent/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string || "5");
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const expenses = await storage.getRecentExpensesByUserId(userId, limit);
      res.json(expenses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/expenses/monthly/:userId/:month/:year", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const month = parseInt(req.params.month);
      const year = parseInt(req.params.year);
      
      if (isNaN(userId) || isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid parameters" });
      }
      
      const expenses = await storage.getExpensesByUserIdAndMonth(userId, month, year);
      res.json(expenses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Budget routes
  app.post("/api/budgets", async (req: Request, res: Response) => {
    try {
      const budgetData = insertBudgetSchema.parse(req.body);
      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error) {
      handleValidationError(error, res);
    }
  });
  
  app.get("/api/budgets/:userId/:month/:year", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const month = parseInt(req.params.month);
      const year = parseInt(req.params.year);
      
      if (isNaN(userId) || isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid parameters" });
      }
      
      const budget = await storage.getBudgetByUserIdAndMonth(userId, month, year);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      res.json(budget);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/budgets/:id", async (req: Request, res: Response) => {
    try {
      const budgetId = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (isNaN(budgetId) || isNaN(amount)) {
        return res.status(400).json({ message: "Invalid parameters" });
      }
      
      const budget = await storage.updateBudget(budgetId, amount);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      res.json(budget);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // AI Analysis routes
  app.post("/api/analyze/expense", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const expense = await extractExpenseFromText(text);
      
      if (!expense) {
        return res.status(422).json({ message: "Could not extract expense information" });
      }
      
      // Get category ID from name
      const category = await storage.getCategoryByName(expense.category);
      
      if (!category) {
        return res.status(404).json({ message: `Category "${expense.category}" not found` });
      }
      
      res.json({
        ...expense,
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color
      });
    } catch (error) {
      console.error("Error analyzing expense:", error);
      res.status(500).json({ message: "Error analyzing expense" });
    }
  });
  
  // Get insights for monthly expenses
  app.get("/api/insights/:userId/:month/:year", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const month = parseInt(req.params.month);
      const year = parseInt(req.params.year);
      
      if (isNaN(userId) || isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid parameters" });
      }
      
      const expenses = await storage.getExpensesByUserIdAndMonth(userId, month, year);
      
      if (expenses.length === 0) {
        return res.json({ insights: ["No expenses found for this month."] });
      }
      
      const insights = await getMonthlyInsights(expenses, month, year);
      res.json({ insights });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
