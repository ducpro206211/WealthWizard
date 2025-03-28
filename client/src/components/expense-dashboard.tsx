import React from "react";
import { ExpenseList } from "@/components/expense-list";
import { ExpenseTrends } from "@/components/expense-trends";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatShortCurrency } from "@/utils/formatCurrency";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface ExpenseDashboardProps {
  userId: number;
}

export function ExpenseDashboard({ userId }: ExpenseDashboardProps) {
  // Fetch recent expenses
  const { data: recentExpenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: [`/api/expenses/recent/${userId}`],
    refetchInterval: 10000, // Refresh every 10 seconds to get new expenses
  });
  
  // Calculate monthly total from expenses
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const { data: monthlyExpenses, isLoading: isLoadingMonthly } = useQuery({
    queryKey: [`/api/expenses/monthly/${userId}/${currentMonth}/${currentYear}`],
  });
  
  // Budget data (for the MVP we'll use a hardcoded budget of 6M VND)
  const mockBudget = 6000000;
  const monthlyTotal = monthlyExpenses?.reduce((acc: number, exp: any) => acc + exp.amount, 0) || 0;
  const budgetPercentage = Math.min(100, Math.round((monthlyTotal / mockBudget) * 100)) || 0;
  
  // Fetch insights
  const { data: insightsData, isLoading: isLoadingInsights } = useQuery({
    queryKey: [`/api/insights/${userId}/${currentMonth}/${currentYear}`],
  });
  
  const insights = insightsData?.insights || [];
  
  // Map category information (for the MVP, we'll hardcode this)
  const getCategoryInfo = (categoryId: number) => {
    switch (categoryId) {
      case 1:
        return { name: "Food", icon: "restaurant", color: "blue" };
      case 2:
        return { name: "Transport", icon: "directions_car", color: "indigo" };
      case 3:
        return { name: "Entertainment", icon: "celebration", color: "purple" };
      case 4:
        return { name: "Groceries", icon: "shopping_basket", color: "green" };
      case 5:
        return { name: "Utilities", icon: "bolt", color: "yellow" };
      default:
        return { name: "Other", icon: "more_horiz", color: "gray" };
    }
  };
  
  // Add category information to expenses
  const processedExpenses = recentExpenses?.map((expense: any) => ({
    ...expense,
    category: getCategoryInfo(expense.categoryId)
  })) || [];

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Expense Overview</h2>
      
      {/* Monthly Progress */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-4">
        <div className="flex justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Budget</h3>
          <div className="text-sm font-mono">
            {isLoadingMonthly ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <>
                <span className="text-primary dark:text-indigo-400">{formatShortCurrency(monthlyTotal)}</span>
                <span className="text-gray-500 dark:text-gray-400">/{formatShortCurrency(mockBudget)}</span>
              </>
            )}
          </div>
        </div>
        
        {isLoadingMonthly ? (
          <Skeleton className="h-2.5 w-full mb-1" />
        ) : (
          <>
            <Progress value={budgetPercentage} className="h-2.5 mb-1" />
            <p className="text-xs text-gray-500 dark:text-gray-400">{budgetPercentage}% of budget used</p>
          </>
        )}
      </div>
      
      {/* Recent Expenses */}
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Expenses</h3>
      <div className="space-y-3 mb-6">
        <ExpenseList 
          expenses={processedExpenses} 
          isLoading={isLoadingExpenses}
          compact={true}
        />
      </div>
      
      {/* Spending Trends */}
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Spending Trends</h3>
      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-4">
        <ExpenseTrends userId={userId} />
      </div>
      
      {/* Optimization Tips */}
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Money-Saving Tips</h3>
      <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
        {isLoadingInsights ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((insight: string, index: number) => (
              <div key={index} className="flex items-start">
                <span className="material-icons text-secondary mr-2 flex-shrink-0">
                  {index === 0 ? "lightbulb" : index === 1 ? "warning" : "savings"}
                </span>
                <p className="text-xs text-gray-800 dark:text-gray-200">{insight}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Add more expenses to get personalized money-saving tips.
          </p>
        )}
      </div>
    </div>
  );
}
