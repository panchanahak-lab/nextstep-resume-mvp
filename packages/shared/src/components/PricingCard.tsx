import React from 'react';
import { Button } from './Button';

export interface PricingCardProps {
  name: string;
  price: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  highlighted?: boolean;
  className?: string;
}

export function PricingCard({
  name,
  price,
  features,
  ctaText,
  ctaLink,
  highlighted = false,
  className = '',
}: PricingCardProps) {
  return (
    <div
      className={`rounded-card border p-6 shadow-sm ${
        highlighted
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
      } ${className}`}
    >
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {name}
      </h3>
      <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
        {price}
      </p>
      <ul className="mt-6 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <a href={ctaLink}>
          <Button
            variant={highlighted ? 'primary' : 'secondary'}
            className="w-full justify-center"
          >
            {ctaText}
          </Button>
        </a>
      </div>
    </div>
  );
}

export default PricingCard;
