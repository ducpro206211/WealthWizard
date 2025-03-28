import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/chat-message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage as ChatMessageType } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/formatCurrency";
import { AIExpense } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  userId: number;
  currency: string;
  monthlyTotal: number;
}

export function ChatInterface({ userId, currency, monthlyTotal }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: uuidv4(),
      content: "Hi there! I'm your expense tracking assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date()
    }
  ]);
  const [messageInput, setMessageInput] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Extract expense using OpenAI
  const analyzeExpenseMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/analyze/expense", { text });
      return response.json();
    },
    onSuccess: async (data: AIExpense & { categoryId: number, categoryName: string, categoryIcon: string, categoryColor: string }) => {
      // Create a new expense record
      await createExpenseMutation.mutate({
        userId,
        amount: data.amount,
        categoryId: data.categoryId,
        description: data.description || "",
        date: new Date(data.date),
        location: data.location || "",
        currency: data.currency
      });
      
      // Add an assistant message with the expense
      setMessages(prev => [...prev, {
        id: uuidv4(),
        content: `Got it! I've recorded your expense:`,
        sender: "assistant",
        timestamp: new Date(),
        expense: {
          id: 0, // Will be updated with the real ID later
          userId,
          categoryId: data.categoryId,
          amount: data.amount,
          description: data.description || "",
          date: new Date(data.date),
          location: data.location || "",
          currency: data.currency,
          category: {
            id: data.categoryId,
            name: data.categoryName,
            icon: data.categoryIcon,
            color: data.categoryColor
          }
        }
      }]);
      
      // Invalidate queries to update the UI
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/user/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/recent/${userId}`] });
      
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      queryClient.invalidateQueries({ 
        queryKey: [`/api/expenses/monthly/${userId}/${currentMonth}/${currentYear}`] 
      });
    },
    onError: (error) => {
      console.error("Error analyzing expense:", error);
      setMessages(prev => [...prev, {
        id: uuidv4(),
        content: "I'm sorry, I couldn't understand that expense. Please try again with more details.",
        sender: "assistant",
        timestamp: new Date()
      }]);
      
      toast({
        title: "Error",
        description: "Failed to analyze expense. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Create expense in the backend
  const createExpenseMutation = useMutation({
    mutationFn: async (expense: any) => {
      const response = await apiRequest("POST", "/api/expenses", expense);
      return response.json();
    },
    onError: (error) => {
      console.error("Error creating expense:", error);
      toast({
        title: "Error",
        description: "Failed to create expense. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Fetch monthly summary
  const fetchMonthlySummaryMutation = useMutation({
    mutationFn: async () => {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const response = await apiRequest("GET", `/api/expenses/monthly/${userId}/${currentMonth}/${currentYear}`, undefined);
      const expenses = await response.json();
      
      // Get insights
      const insightsResponse = await apiRequest("GET", `/api/insights/${userId}/${currentMonth}/${currentYear}`, undefined);
      const { insights } = await insightsResponse.json();
      
      return { expenses, insights };
    },
    onSuccess: async (data) => {
      const { expenses, insights } = data;
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      // Calculate totals and percentages by category
      const categoryMap = new Map<number, { 
        id: number;
        name: string;
        icon: string;
        color: string;
        amount: number;
      }>();
      
      let totalAmount = 0;
      
      expenses.forEach((expense: any) => {
        totalAmount += expense.amount;
        
        // Group by categoryId
        if (categoryMap.has(expense.categoryId)) {
          const category = categoryMap.get(expense.categoryId)!;
          category.amount += expense.amount;
        } else {
          // For the MVP, we use a fixed list of categories
          // In a real app, we would fetch this from the server
          const categoryInfo = {
            id: expense.categoryId,
            name: "Other", // Default
            icon: "more_horiz",
            color: "gray"
          };
          
          // Simple mapping for demo
          if (expense.categoryId === 1) {
            categoryInfo.name = "Food";
            categoryInfo.icon = "restaurant";
            categoryInfo.color = "blue";
          } else if (expense.categoryId === 2) {
            categoryInfo.name = "Transport";
            categoryInfo.icon = "directions_car";
            categoryInfo.color = "indigo";
          } else if (expense.categoryId === 3) {
            categoryInfo.name = "Entertainment";
            categoryInfo.icon = "celebration";
            categoryInfo.color = "purple";
          } else if (expense.categoryId === 4) {
            categoryInfo.name = "Groceries";
            categoryInfo.icon = "shopping_basket";
            categoryInfo.color = "green";
          } else if (expense.categoryId === 5) {
            categoryInfo.name = "Utilities";
            categoryInfo.icon = "bolt";
            categoryInfo.color = "yellow";
          }
          
          categoryMap.set(expense.categoryId, {
            ...categoryInfo,
            amount: expense.amount
          });
        }
      });
      
      // Convert to array and calculate percentages
      const categories = Array.from(categoryMap.values()).map(category => ({
        ...category,
        percentage: Math.round((category.amount / totalAmount) * 100) || 0
      }));
      
      // Sort by amount descending
      categories.sort((a, b) => b.amount - a.amount);
      
      // Add the summary message
      setMessages(prev => [...prev, {
        id: uuidv4(),
        content: "Here's your expense summary for this month:",
        sender: "assistant",
        timestamp: new Date(),
        summaryData: {
          totalAmount,
          categories,
          month: currentMonth,
          year: currentYear
        },
        insights
      }]);
    },
    onError: (error) => {
      console.error("Error fetching monthly summary:", error);
      setMessages(prev => [...prev, {
        id: uuidv4(),
        content: "I'm sorry, I couldn't generate your monthly summary at this time. Please try again later.",
        sender: "assistant",
        timestamp: new Date()
      }]);
      
      toast({
        title: "Error",
        description: "Failed to generate monthly summary. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleSendMessage = () => {
    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage) return;
    
    // Add user message
    setMessages(prev => [...prev, {
      id: uuidv4(),
      content: trimmedMessage,
      sender: "user",
      timestamp: new Date()
    }]);
    
    // Clear input
    setMessageInput("");
    
    // Process message
    const lowerCaseMessage = trimmedMessage.toLowerCase();
    if (
      lowerCaseMessage.includes("summary") || 
      lowerCaseMessage.includes("show me my expenses") || 
      lowerCaseMessage.includes("this month")
    ) {
      // Generate monthly summary
      fetchMonthlySummaryMutation.mutate();
    } else if (
      lowerCaseMessage.includes("spent") || 
      lowerCaseMessage.includes("paid") || 
      lowerCaseMessage.includes("bought") ||
      lowerCaseMessage.includes("purchased")
    ) {
      // Analyze expense
      analyzeExpenseMutation.mutate(trimmedMessage);
    } else {
      // Generic response
      setMessages(prev => [...prev, {
        id: uuidv4(),
        content: "I can help you track expenses or show you summaries. Try saying something like 'I spent 50,000 VND on coffee' or 'Show me my monthly summary'.",
        sender: "assistant",
        timestamp: new Date()
      }]);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Sub-header with monthly stats */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 flex justify-between items-center">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Summary</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">This Month:</span>
          <span className="font-mono font-medium text-sm">{formatCurrency(monthlyTotal)}</span>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-container">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="border-t dark:border-gray-700 bg-white dark:bg-dark-surface p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50">
            <Textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your expense (e.g., 'Spent 200k on dinner')"
              className="w-full bg-transparent border-0 focus:ring-0 resize-none max-h-32 text-gray-800 dark:text-gray-200 placeholder-gray-500"
              rows={1}
            />
          </div>
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            className="rounded-full"
            disabled={analyzeExpenseMutation.isPending || createExpenseMutation.isPending || fetchMonthlySummaryMutation.isPending}
          >
            <span className="material-icons">send</span>
          </Button>
        </div>
        <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
          <span className="material-icons text-xs mr-1">info</span>
          <span>Try saying "Show me my expenses this month" or "I spent 50,000 VND on coffee"</span>
        </div>
      </div>
    </div>
  );
}
