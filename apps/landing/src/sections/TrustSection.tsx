import React from 'react';
import { ShieldCheck, Lock, Smartphone, CreditCard, Languages } from 'lucide-react';

const TrustSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-12">
          <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Built in India, for India.
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your data stays private. We never sell your information. Designed for real job seekers, not just experts.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 max-w-4xl mx-auto opacity-70">
          <div className="flex flex-col items-center gap-2">
            <Lock className="w-8 h-8 text-gray-400" />
            <span className="text-sm font-semibold text-gray-600">Private and secure</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Smartphone className="w-8 h-8 text-gray-400" />
            <span className="text-sm font-semibold text-gray-600">Mobile-friendly</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CreditCard className="w-8 h-8 text-gray-400" />
            <span className="text-sm font-semibold text-gray-600">UPI-friendly</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Languages className="w-8 h-8 text-gray-400" />
            <span className="text-sm font-semibold text-gray-600">Indian languages</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
