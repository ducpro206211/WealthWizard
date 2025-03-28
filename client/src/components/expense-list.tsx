import React from "react";
import { Expense, Category } from "@shared/schema";
import { ExpenseCard } from "@/components/ui/expense-card";
import { Skeleton } from "@/components/ui/skeleton";

interface ExpenseListProps {
  expenses: (Expense & { category: Category })[];
  isLoading?: boolean;
  emptyMessage?: string;
  compact?: boolean;
}

export function ExpenseList({ 
  expenses, 
  isLoading = false, 
  emptyMessage = "No expenses found", 
  compact = false 
}: ExpenseListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (expenses.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <ExpenseCard 
          key={expense.id} 
          expense={expense} 
          category={expense.category}
          compact={compact}
        />
      ))}
    </div>
  );
}
