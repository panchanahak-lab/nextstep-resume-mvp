import React from 'react';
import { ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section id="hero" className="relative bg-white dark:bg-neutral-900 pt-24 pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-16">
        {/* Left side */}
        <div className="lg:w-1/2 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
            Built for Indian job seekers across industries
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
            Build a Job-Ready Resume and <span className="text-blue-600 dark:text-blue-400">Prepare with AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-neutral-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Create resumes, scan ATS readiness, and practice live AI interviews in your preferred language.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200">
              Create Account
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-gray-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:bg-neutral-950 transition-all shadow-sm">
              See How It Works
            </button>
          </div>

          <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-500 dark:text-neutral-500 font-medium">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Sign in to create resumes, unlock your first CV scan, and track your interview results.
          </div>
        </div>

        {/* Right side - Visuals */}
        <div className="lg:w-1/2 w-full relative">
          {/* Main Resume Card */}
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 p-6 lg:p-8 ml-auto max-w-md z-10 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-neutral-800 pb-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-full"></div>
                <div>
                  <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-16 h-3 bg-gray-100 dark:bg-neutral-800 rounded"></div>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </div>
            </div>
            <div className="space-y-3">
              <div className="w-3/4 h-3 bg-gray-100 dark:bg-neutral-800 rounded"></div>
              <div className="w-full h-3 bg-gray-100 dark:bg-neutral-800 rounded"></div>
              <div className="w-5/6 h-3 bg-gray-100 dark:bg-neutral-800 rounded"></div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="w-1/3 h-4 bg-gray-200 rounded mb-4"></div>
              <div className="w-full h-3 bg-gray-100 dark:bg-neutral-800 rounded"></div>
              <div className="w-full h-3 bg-gray-100 dark:bg-neutral-800 rounded"></div>
              <div className="w-4/5 h-3 bg-gray-100 dark:bg-neutral-800 rounded"></div>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="absolute top-10 -left-10 bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-800 z-20 flex items-center gap-4 animate-bounce-slow">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl">
              92
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">ATS Score</p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Excellent match</p>
            </div>
          </div>

          <div className="absolute -bottom-6 right-10 bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-800 z-20 flex items-center gap-4 animate-bounce-slow-reverse">
            <div className="p-3 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Interview Ready</p>
              <p className="text-xs text-gray-500 dark:text-neutral-500 font-medium">85% confidence</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
