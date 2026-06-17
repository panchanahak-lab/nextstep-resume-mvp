import React from 'react';
import { PricingCard } from '../../../../packages/shared/src/components/PricingCard';

const plans = [
  {
    name: 'Free Preview',
    price: 'Free',
    features: [
      'Resume builder preview',
      'Basic resume structure',
      'Limited mock data',
    ],
    ctaText: 'Get Started Free',
    ctaLink: 'http://localhost:3001',
    highlighted: false,
  },
  {
    name: 'Career Launch Pack',
    price: '₹499',
    features: [
      'Resume Builder',
      'ATS Score & Analysis',
      'Resume Improvement Tips',
      'AI Mock Interview',
      'PDF Download',
    ],
    ctaText: 'Open App',
    ctaLink: 'http://localhost:3001',
    highlighted: true,
  },
];

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-neutral-900 text-center">
          Simple, Transparent Pricing
        </h2>

        <div className="flex flex-col md:flex-row gap-8 justify-center mt-12">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              name={plan.name}
              price={plan.price}
              features={plan.features}
              ctaText={plan.ctaText}
              ctaLink={plan.ctaLink}
              highlighted={plan.highlighted}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
