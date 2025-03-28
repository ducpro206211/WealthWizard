import React, { useEffect, useRef } from "react";
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip } from "chart.js";
import { formatShortCurrency } from "@/utils/formatCurrency";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

interface ExpenseTrendsProps {
  userId: number;
}

export function ExpenseTrends({ userId }: ExpenseTrendsProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  // Fetch monthly expenses
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const { data: monthlyExpenses, isLoading } = useQuery({
    queryKey: [`/api/expenses/monthly/${userId}/${currentMonth}/${currentYear}`],
  });
  
  useEffect(() => {
    if (!chartRef.current || isLoading || !monthlyExpenses) return;
    
    // Clean up previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Group expenses by day
    const expensesByDay = new Map<number, number>();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // Initialize all days with zero
    for (let i = 1; i <= daysInMonth; i++) {
      expensesByDay.set(i, 0);
    }
    
    // Aggregate expenses by day
    monthlyExpenses.forEach((expense: any) => {
      const expenseDate = new Date(expense.date);
      const day = expenseDate.getDate();
      expensesByDay.set(day, (expensesByDay.get(day) || 0) + expense.amount);
    });
    
    // Prepare chart data
    // Get 7 sample points across the month for cleaner visualization
    const samplePoints = [1, 5, 10, 15, 20, 25, 30].filter(day => day <= daysInMonth);
    const labels = samplePoints.map(day => day.toString());
    
    // Get cumulative spending up to each sample point
    const data = samplePoints.map(day => {
      let total = 0;
      for (let i = 1; i <= day; i++) {
        total += expensesByDay.get(i) || 0;
      }
      return total;
    });
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    
    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Cumulative Spending',
          data,
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              callback: function(value) {
                return formatShortCurrency(value as number, 'VND').replace(' ₫', '');
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: textColor
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return `Total: ${formatShortCurrency(value, 'VND')}`;
              }
            }
          }
        }
      }
    });
    
    // Clean up on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [isLoading, monthlyExpenses, currentMonth, currentYear]);
  
  return (
    <div className="h-[180px]">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Skeleton className="h-[150px] w-full" />
        </div>
      ) : (
        <canvas ref={chartRef}></canvas>
      )}
    </div>
  );
}
