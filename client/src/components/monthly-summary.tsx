import React from "react";
import { ExpenseChart } from "@/components/expense-chart";
import { formatCurrency } from "@/utils/formatCurrency";
import { MonthlyExpenseSummary } from "@/types";
import { format } from "date-fns";

interface MonthlySummaryProps {
  data: MonthlyExpenseSummary;
}

export function MonthlySummary({ data }: MonthlySummaryProps) {
  const { totalAmount, categories, month, year } = data;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-600">
      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
        {format(new Date(year, month - 1), "MMMM yyyy")}
      </h3>
      
      {/* Expense Chart */}
      <div className="h-48 mb-4">
        <ExpenseChart categories={categories} />
      </div>
      
      {/* Category Breakdown */}
      <div className="space-y-2">
        {categories.map((category, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ 
                  backgroundColor: 
                    category.color === 'blue' ? '#3B82F6' : 
                    category.color === 'green' ? '#10B981' :
                    category.color === 'yellow' ? '#F59E0B' :
                    category.color === 'purple' ? '#8B5CF6' :
                    category.color === 'red' ? '#EF4444' :
                    category.color === 'orange' ? '#F97316' :
                    category.color === 'indigo' ? '#6366F1' :
                    category.color === 'pink' ? '#EC4899' : '#6B7280'
                }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-mono">{formatCurrency(category.amount)}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({category.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t dark:border-gray-700 flex justify-between">
        <span className="font-medium">Total</span>
        <span className="font-mono font-medium">{formatCurrency(totalAmount)}</span>
      </div>
    </div>
  );
}
