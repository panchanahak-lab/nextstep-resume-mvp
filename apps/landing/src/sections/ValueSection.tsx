import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ValueSection: React.FC = () => {
  const benefits = [
    "Create a professional resume in minutes",
    "Scan your resume and improve ATS score",
    "Practice live AI mock interviews",
    "Get feedback in your preferred language",
    "Download job-ready PDF resumes",
    "Built for Indian job seekers across industries"
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-neutral-950 border-y border-gray-100 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Built for Every Job Seeker
            </h2>
            <p className="text-lg text-gray-600 dark:text-neutral-400 mb-8 leading-relaxed">
              Whether you are a fresher, experienced professional, diploma holder, or career switcher, NextStep helps you create a professional resume, check ATS readiness, and practice live AI interviews in your preferred language.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-gray-700 dark:text-neutral-200 font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-neutral-800 relative">
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-2xl -z-10 blur opacity-50"></div>
              <div className="flex gap-4 items-center mb-6 border-b border-gray-100 dark:border-neutral-800 pb-6">
                <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full shrink-0"></div>
                <div>
                  <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-48 bg-gray-100 dark:bg-neutral-800 rounded"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded"></div>
                <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-100 dark:bg-neutral-800 rounded"></div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-xl">
                  <div className="h-8 w-8 bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold mb-2">A</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">ATS Ready</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-xl">
                  <div className="h-8 w-8 bg-purple-100 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center font-bold mb-2">A+</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Interview Ready</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueSection;
