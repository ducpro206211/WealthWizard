import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Currency } from "@/types";

interface HeaderProps {
  onCurrencyChange: (currency: Currency) => void;
  selectedCurrency: Currency;
}

export function Header({ onCurrencyChange, selectedCurrency }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const queryClient = useQueryClient();
  
  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedDarkMode === 'true' || (prefersDarkMode && savedDarkMode !== 'false')) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('darkMode', newDarkMode.toString());
  };
  
  // Handle currency change
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value as Currency;
    onCurrencyChange(newCurrency);
    
    // Invalidate queries that might be affected by currency change
    queryClient.invalidateQueries();
  };

  return (
    <header className="bg-white dark:bg-dark-surface shadow z-10 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <span className="material-icons text-primary dark:text-indigo-400 mr-2">account_balance_wallet</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">ExpenseAI</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Currency Selector */}
            <div className="relative">
              <select 
                className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedCurrency}
                onChange={handleCurrencyChange}
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
              <span className="material-icons absolute right-2 top-2 text-gray-400 pointer-events-none text-sm">arrow_drop_down</span>
            </div>
            
            {/* Dark Mode Toggle */}
            <button 
              className={`dark-mode-toggle p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${isDarkMode ? 'dark' : ''}`}
              onClick={toggleDarkMode}
            >
              <span className="material-icons text-gray-600 dark:text-gray-300">dark_mode</span>
            </button>
            
            {/* User Menu */}
            <div className="relative">
              <button className="flex items-center space-x-1">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                  <span className="text-sm font-medium">TN</span>
                </div>
                <span className="material-icons text-gray-400 text-sm">arrow_drop_down</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
