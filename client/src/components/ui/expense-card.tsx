import React from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { CategoryBadge } from "./category-badge";
import { format } from "date-fns";
import { Expense, Category } from "@shared/schema";

interface ExpenseCardProps {
  expense: Expense;
  category: Category;
  compact?: boolean;
}

export function ExpenseCard({ expense, category, compact = false }: ExpenseCardProps) {
  const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
  const dateString = compact 
    ? format(expenseDate, "PPP")
    : format(expenseDate, "PPP, p");
  
  const locationLabel = expense.location ? `, ${expense.location}` : '';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-600">
      <div className="flex justify-between items-start">
        <div>
          <div className="mb-2">
            <CategoryBadge 
              name={category.name} 
              icon={category.icon} 
              color={category.color} 
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {dateString}{locationLabel}
          </p>
          {!compact && expense.description && (
            <p className="text-sm text-gray-800 dark:text-gray-300 mt-1">
              {expense.description}
            </p>
          )}
        </div>
        <div className="font-mono text-lg font-medium">
          {formatCurrency(expense.amount, expense.currency as 'VND' | 'USD' | 'EUR')}
        </div>
      </div>
    </div>
  );
}
