import React from 'react';

const steps = [
  {
    number: '1',
    title: 'Create or Upload',
    description: 'Create or upload your resume using our guided builder.',
  },
  {
    number: '2',
    title: 'Scan & Improve',
    description: 'Scan and improve with AI feedback and ATS scoring.',
  },
  {
    number: '3',
    title: 'Practice & Apply',
    description: 'Practice mock interviews and improve before applying.',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-neutral-900 text-center">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 relative">
          {/* Dashed connector line — desktop only */}
          <div className="hidden md:block absolute top-5 left-1/6 right-1/6 h-0.5 border-t-2 border-dashed border-neutral-300" style={{ left: '20%', right: '20%' }} />

          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mt-4">
                {step.title}
              </h3>
              <p className="text-neutral-600 mt-2 max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
