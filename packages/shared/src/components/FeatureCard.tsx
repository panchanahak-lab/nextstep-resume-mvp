import React from 'react';
import { Card } from './Card';

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  className = '',
}: FeatureCardProps) {
  return (
    <Card className={className}>
      <div className="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 w-12 h-12 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mt-4">
        {title}
      </h3>
      <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-2">
        {description}
      </p>
    </Card>
  );
}

export default FeatureCard;
