import React from "react";
import { cn } from "@/lib/utils";

type CategoryColor = 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'orange' | 'indigo' | 'pink' | 'gray';

const colorClasses: Record<CategoryColor, { bg: string, text: string }> = {
  blue: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-800 dark:text-blue-200" },
  green: { bg: "bg-green-100 dark:bg-green-900", text: "text-green-800 dark:text-green-200" },
  yellow: { bg: "bg-yellow-100 dark:bg-yellow-900", text: "text-yellow-800 dark:text-yellow-200" },
  purple: { bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-800 dark:text-purple-200" },
  red: { bg: "bg-red-100 dark:bg-red-900", text: "text-red-800 dark:text-red-200" },
  orange: { bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-800 dark:text-orange-200" },
  indigo: { bg: "bg-indigo-100 dark:bg-indigo-900", text: "text-indigo-800 dark:text-indigo-200" },
  pink: { bg: "bg-pink-100 dark:bg-pink-900", text: "text-pink-800 dark:text-pink-200" },
  gray: { bg: "bg-gray-100 dark:bg-gray-900", text: "text-gray-800 dark:text-gray-200" }
};

interface CategoryBadgeProps {
  name: string;
  icon: string;
  color: string;
  className?: string;
}

export function CategoryBadge({ name, icon, color, className }: CategoryBadgeProps) {
  const colorClass = colorClasses[color as CategoryColor] || colorClasses.gray;
  
  return (
    <div className={cn(
      "inline-flex items-center rounded-full py-1 px-2 text-xs font-medium",
      colorClass.bg,
      colorClass.text,
      className
    )}>
      <span className="material-icons text-xs mr-1">{icon}</span>
      <span>{name}</span>
    </div>
  );
}
