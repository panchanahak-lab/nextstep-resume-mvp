import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  className = '',
}: StatCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div className="text-primary-600 dark:text-primary-400">{icon}</div>
        {trend && (
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-3">
        {value}
      </p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
        {title}
      </p>
    </Card>
  );
}

export default StatCard;
