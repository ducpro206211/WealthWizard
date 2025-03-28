import React from "react";
import { ChatMessage as ChatMessageType } from "@/types";
import { ExpenseCard } from "@/components/ui/expense-card";
import { ExpenseChart } from "@/components/expense-chart";
import { formatCurrency } from "@/utils/formatCurrency";
import { format } from "date-fns";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex items-start ${isUser ? 'justify-end' : ''} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-2 flex-shrink-0">
          <span className="material-icons text-sm">smart_toy</span>
        </div>
      )}
      
      <div className={`chat-message max-w-[80%] ${
        isUser 
          ? 'bg-primary text-white rounded-lg rounded-tr-none' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg rounded-tl-none'
      } p-3`}>
        <p className={isUser ? '' : 'mb-2'}>{message.content}</p>
        
        {/* Expense Card (if present) */}
        {message.expense && message.expense.category && (
          <div className="mt-2">
            <ExpenseCard expense={message.expense} category={message.expense.category} />
          </div>
        )}
        
        {/* Monthly Summary (if present) */}
        {message.summaryData && (
          <div className="bg-white dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-600 mt-3">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {format(new Date(message.summaryData.year, message.summaryData.month - 1), "MMMM yyyy")}
            </h3>
            
            {/* Expense Chart */}
            <div className="h-48 mb-4">
              <ExpenseChart categories={message.summaryData.categories} />
            </div>
            
            {/* Category Breakdown */}
            <div className="space-y-2">
              {message.summaryData.categories.map((category, index) => (
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
              <span className="font-mono font-medium">{formatCurrency(message.summaryData.totalAmount)}</span>
            </div>
          </div>
        )}
        
        {/* Insights (if present) */}
        {message.insights && message.insights.length > 0 && (
          <ul className="list-disc pl-5 space-y-1 mt-2">
            {message.insights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center ml-2 flex-shrink-0">
          <span className="text-sm font-medium">TN</span>
        </div>
      )}
    </div>
  );
}
