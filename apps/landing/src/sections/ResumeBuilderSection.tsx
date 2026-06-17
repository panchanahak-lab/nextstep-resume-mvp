import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { APP_ROUTES } from '@nextstep/shared';
import { useAuthActions } from '../context/AuthActionContext';

const ResumeBuilderSection: React.FC = () => {
  const { goToProtectedRoute } = useAuthActions();

  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Never made a resume before? Perfect. This is built for you.
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Just fill what you know. We will handle the rest.
            </p>
            
            <div className="space-y-6 mb-8">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Summary
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
                <div className="w-full h-24 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-400">
                  Tell us about yourself. We will write it professionally...
                </div>
              </div>
            </div>

            <button
              onClick={() => goToProtectedRoute(APP_ROUTES.builder)}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
            >
              Create Resume
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 aspect-[1/1.2] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
              <div className="text-center mb-6 mt-4">
                <div className="h-6 w-48 bg-gray-800 rounded mx-auto mb-2"></div>
                <div className="h-3 w-32 bg-gray-400 rounded mx-auto"></div>
              </div>
              <div className="space-y-6 flex-1">
                <div>
                  <div className="h-4 w-24 bg-blue-600 rounded mb-3"></div>
                  <div className="h-2 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-2 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                </div>
                <div>
                  <div className="h-4 w-24 bg-blue-600 rounded mb-3"></div>
                  <div className="flex justify-between mb-2">
                    <div className="h-3 w-32 bg-gray-800 rounded"></div>
                    <div className="h-3 w-16 bg-gray-400 rounded"></div>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResumeBuilderSection;
