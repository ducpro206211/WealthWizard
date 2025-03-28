import React, { useEffect, useRef } from "react";
import { CategoryWithStats } from "@/types";
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from "chart.js";
import { formatCurrency } from "@/utils/formatCurrency";

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

interface ExpenseChartProps {
  categories: CategoryWithStats[];
  height?: number;
}

const categoryColors = {
  "Food": "#3B82F6", // blue
  "Transport": "#6366F1", // indigo
  "Entertainment": "#8B5CF6", // purple
  "Groceries": "#10B981", // green
  "Utilities": "#F59E0B", // yellow
  "Housing": "#F97316", // orange
  "Healthcare": "#EF4444", // red
  "Shopping": "#EC4899", // pink
  "Other": "#6B7280" // gray
};

export function ExpenseChart({ categories, height = 200 }: ExpenseChartProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Clean up previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Prepare chart data
    const labels = categories.map(cat => cat.name);
    const data = categories.map(cat => cat.percentage);
    const backgroundColors = categories.map(cat => categoryColors[cat.name as keyof typeof categoryColors] || "#6B7280");
    
    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: backgroundColors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const categoryIndex = context.dataIndex;
                const category = categories[categoryIndex];
                const amount = formatCurrency(category.amount);
                return `${category.name}: ${category.percentage}% (${amount})`;
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
  }, [categories]);
  
  return (
    <div style={{ height: `${height}px` }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
}
