import React from 'react';
import { ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section id="hero" className="relative bg-white pt-24 pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-16">
        {/* Left side */}
        <div className="lg:w-1/2 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
            Built for Indian job seekers across industries
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            From blank page to <span className="text-blue-600">job-ready resume</span> — in minutes.
          </h1>

          <p className="text-lg lg:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0">
            Create resumes, scan ATS readiness, and practice live AI interviews in your preferred language.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200">
              Start Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <a href="#how-it-works" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-full font-semibold text-gray-700 hover:bg-gray-100 transition-all">
              See How It Works
            </a>
          </div>

          <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500 font-medium">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-700">A</div>
              <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-xs font-bold text-green-700">R</div>
              <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-bold text-purple-700">P</div>
            </div>
            <p>Trusted by 10,000+ candidates</p>
          </div>
        </div>

        {/* Right side - Visuals */}
        <div className="lg:w-1/2 w-full relative">
          {/* Main Resume Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 lg:p-8 ml-auto max-w-md z-10 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
                <div>
                  <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-16 h-3 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </div>
            </div>
            <div className="space-y-3">
              <div className="w-3/4 h-3 bg-gray-100 rounded"></div>
              <div className="w-full h-3 bg-gray-100 rounded"></div>
              <div className="w-5/6 h-3 bg-gray-100 rounded"></div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="w-1/3 h-4 bg-gray-200 rounded mb-4"></div>
              <div className="w-full h-3 bg-gray-100 rounded"></div>
              <div className="w-full h-3 bg-gray-100 rounded"></div>
              <div className="w-4/5 h-3 bg-gray-100 rounded"></div>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="absolute top-10 -left-10 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 z-20 flex items-center gap-4 animate-bounce-slow">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl">
              92
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">ATS Score</p>
              <p className="text-xs text-green-600 font-medium">Excellent match</p>
            </div>
          </div>

          <div className="absolute -bottom-6 right-10 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 z-20 flex items-center gap-4 animate-bounce-slow-reverse">
            <div className="p-3 rounded-full bg-purple-50 text-purple-600">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Interview Ready</p>
              <p className="text-xs text-gray-500 font-medium">85% confidence</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
