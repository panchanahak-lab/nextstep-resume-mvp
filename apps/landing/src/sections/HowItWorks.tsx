import React from 'react';
import { ArrowRight } from 'lucide-react';
import { APP_ROUTES } from '@nextstep/shared';
import { useAuthActions } from '../context/AuthActionContext';

const steps = [
  {
    number: '1',
    title: 'Create or Upload',
    description: 'Fill details or upload your existing resume.',
  },
  {
    number: '2',
    title: 'Scan & Improve',
    description: 'Improve with ATS scan and AI suggestions.',
  },
  {
    number: '3',
    title: 'Practice & Apply',
    description: 'Practice interview and download your final resume.',
  },
];

const HowItWorks: React.FC = () => {
  const { goToProtectedRoute } = useAuthActions();

  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Dashed connector line — desktop only */}
          <div className="hidden md:block absolute top-6 left-[16.6%] right-[16.6%] h-0.5 border-t-2 border-dashed border-gray-200" />

          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center relative z-10 group">
              <div className="w-14 h-14 rounded-full bg-white border-4 border-gray-50 text-blue-600 flex items-center justify-center font-bold text-xl shadow-lg mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:border-blue-100 group-hover:text-white transition-all duration-300">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 max-w-xs leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <button
            onClick={() => goToProtectedRoute(APP_ROUTES.builder, 'signup')}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
          >
            Try It Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
