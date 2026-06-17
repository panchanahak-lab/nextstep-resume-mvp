import React from 'react';
import { Check } from 'lucide-react';
import { APP_ROUTES } from '@nextstep/shared';
import { useAuthActions } from '../context/AuthActionContext';

const Pricing: React.FC = () => {
  const { goToProtectedRoute, startFree } = useAuthActions();

  return (
    <section id="pricing" className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
          <p className="text-lg text-gray-600">No hidden charges. UPI-friendly payments. Cancel anytime.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
            <p className="text-gray-500 text-sm mb-6">Perfect to get started</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-gray-900">₹0</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-gray-600">
                <Check className="w-5 h-5 text-blue-500 shrink-0" /> 1 resume
              </li>
              <li className="flex items-start gap-3 text-gray-600">
                <Check className="w-5 h-5 text-blue-500 shrink-0" /> Basic ATS scan
              </li>
              <li className="flex items-start gap-3 text-gray-600">
                <Check className="w-5 h-5 text-blue-500 shrink-0" /> Limited text interview
              </li>
            </ul>
            <button
              onClick={startFree}
              className="w-full py-3 rounded-xl font-bold border-2 border-blue-100 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Start Free
            </button>
          </div>

          {/* Pay Per Use Plan */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-blue-500 flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pay Per Use</h3>
            <p className="text-gray-500 text-sm mb-6">Pay only when you need</p>
            <div className="mb-6 flex items-baseline">
              <span className="text-4xl font-extrabold text-gray-900">₹99</span>
              <span className="text-gray-500 ml-1">/use</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-gray-600">
                <Check className="w-5 h-5 text-blue-500 shrink-0" /> Resume PDF download
              </li>
              <li className="flex items-start gap-3 text-gray-600">
                <Check className="w-5 h-5 text-blue-500 shrink-0" /> One premium ATS scan
              </li>
              <li className="flex items-start gap-3 text-gray-600">
                <Check className="w-5 h-5 text-blue-500 shrink-0" /> One live voice interview
              </li>
            </ul>
            <button
              onClick={() => goToProtectedRoute(APP_ROUTES.dashboard, 'signup')}
              className="w-full py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Pay As You Need
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
            <p className="text-gray-500 text-sm mb-6">For active job seekers</p>
            <div className="mb-6 flex items-baseline">
              <span className="text-4xl font-extrabold text-gray-900">₹499</span>
              <span className="text-gray-500 ml-1">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-gray-600">
                <Check className="w-5 h-5 text-blue-500 shrink-0" /> Unlimited resumes
              </li>
              <li className="flex items-start gap-3 text-gray-600">
                <Check className="w-5 h-5 text-blue-500 shrink-0" /> Unlimited ATS scans
              </li>
              <li className="flex items-start gap-3 text-gray-600">
                <Check className="w-5 h-5 text-blue-500 shrink-0" /> Unlimited mock interviews
              </li>
              <li className="flex items-start gap-3 text-gray-600">
                <Check className="w-5 h-5 text-blue-500 shrink-0" /> Saved history
              </li>
            </ul>
            <button
              onClick={() => goToProtectedRoute(APP_ROUTES.dashboard, 'signup')}
              className="w-full py-3 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-lg"
            >
              Go Pro
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
