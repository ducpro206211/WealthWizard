import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { ChatInterface } from "@/components/chat-interface";
import { ExpenseDashboard } from "@/components/expense-dashboard";
import { useQuery } from "@tanstack/react-query";
import { Currency } from "@/types";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('VND');
  
  // For MVP, we'll use a hardcoded user ID
  const userId = 1;
  
  // Calculate monthly total from expenses
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const { data: monthlyExpenses, isLoading } = useQuery({
    queryKey: [`/api/expenses/monthly/${userId}/${currentMonth}/${currentYear}`],
  });
  
  const monthlyTotal = monthlyExpenses?.reduce((acc: number, exp: any) => acc + exp.amount, 0) || 0;
  
  return (
    <div className="flex flex-col h-screen">
      <Header onCurrencyChange={setSelectedCurrency} selectedCurrency={selectedCurrency} />
      
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          <div className="flex flex-col md:flex-row h-full">
            {/* Chat Section */}
            <div className="flex-1 flex flex-col h-full md:border-r dark:border-gray-700 overflow-hidden">
              <ChatInterface 
                userId={userId} 
                currency={selectedCurrency} 
                monthlyTotal={monthlyTotal}
              />
            </div>
            
            {/* Dashboard Section (visible only on larger screens) */}
            <div className="hidden md:block md:w-80 lg:w-96 h-full bg-gray-50 dark:bg-gray-800 overflow-y-auto scroll-container">
              <ExpenseDashboard userId={userId} />
            </div>
          </div>
        </div>
      </main>
      
      {/* Mobile Dashboard Button */}
      <div className="md:hidden fixed right-4 bottom-20">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
              <span className="material-icons">bar_chart</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] pt-6">
            <ExpenseDashboard userId={userId} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
