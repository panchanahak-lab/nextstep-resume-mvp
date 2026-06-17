import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-neutral-300 dark:text-neutral-600 mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <p className="text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export default EmptyState;
