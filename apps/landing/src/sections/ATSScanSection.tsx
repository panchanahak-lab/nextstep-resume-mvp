import React from 'react';
import { ShieldAlert, CheckCircle2, XCircle, ArrowRight, RefreshCw } from 'lucide-react';

const ATSScanSection: React.FC = () => {
  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 w-full order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Your ATS Scan Result</h3>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-full border-8 border-yellow-400 flex items-center justify-center">
                  <span className="text-3xl font-extrabold text-gray-900">64</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Score out of 100</p>
                  <p className="text-lg font-bold text-yellow-600">Needs Improvement</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Matched Keywords</p>
                    <p className="text-sm text-gray-600">React, JavaScript, Teamwork</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Missing Keywords</p>
                    <p className="text-sm text-gray-600">TypeScript, Next.js, Redux</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Formatting Issues</p>
                    <p className="text-sm text-gray-600">Tables found. ATS cannot read tables properly.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="font-bold text-blue-900 text-sm mb-1">What to Fix First</p>
                <p className="text-sm text-blue-700">Remove the table in your experience section and use bullet points instead.</p>
              </div>

              <div className="mt-6 flex justify-end">
                <button className="text-sm font-semibold text-gray-600 flex items-center gap-2 hover:text-gray-900 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Rescan After Changes
                </button>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Check If Your Resume Will Reach a Recruiter
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Most companies use software to filter resumes before a human reads them. Scan your CV to see keyword gaps, formatting issues, and what to improve first.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200">
                Create Account to Scan Your CV
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm font-semibold text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3 inline-block">
              First-time users get 1 ATS scan included after signup.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ATSScanSection;
