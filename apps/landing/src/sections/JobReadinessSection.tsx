import React from 'react';
import { Target, ArrowRight } from 'lucide-react';

const JobReadinessSection: React.FC = () => {
  return (
    <section className="py-24 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              Paste any job. Know if your resume is ready for it.
            </h2>
            <p className="text-lg text-gray-600 dark:text-neutral-400 mb-8 leading-relaxed">
              Stop applying blindly. See what is missing first.
            </p>

            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 mx-auto lg:mx-0">
              Create Account to Scan CV
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-800 overflow-hidden relative">
              <div className="h-2 w-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Frontend Developer</h3>
                    <p className="text-sm text-gray-500 dark:text-neutral-500">TechCorp India • Remote</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <Target className="w-4 h-4" /> 72/100
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-900 dark:text-white font-bold mb-2">You are <span className="text-blue-600 dark:text-blue-400">72/100</span> ready for this job.</p>
                  <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Missing Skills</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-semibold rounded-lg border border-red-100">GraphQL</span>
                      <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-semibold rounded-lg border border-red-100">Jest</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Suggested Resume Improvements</p>
                    <ul className="text-sm text-gray-600 dark:text-neutral-400 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span> Add metrics to your previous role (e.g., "Improved load time by 20%").
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span> Mention experience with testing frameworks.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JobReadinessSection;
