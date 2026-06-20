import React from 'react';
import { FileText, ScanSearch, UserSquare2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const actions = [
  {
    title: 'Create Resume',
    description: 'Build a professional resume with guided examples and ready-to-download PDF formats.',
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    cta: 'Build Your Resume',
    helperLine: 'Sign in to save and download your resume.',
    href: '#builder',
  },
  {
    title: 'Scan Resume',
    description: 'Check ATS score, missing keywords, and line-by-line fixes before you apply.',
    icon: ScanSearch,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    cta: 'Scan Your CV',
    helperLine: 'First-time users get 1 ATS scan included after signup.',
    href: '#scan',
  },
  {
    title: 'Live AI Mock Interview',
    description: 'Practice speaking with AI, get scored feedback, and improve before the real interview.',
    icon: UserSquare2,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    cta: 'Start Mock Interview',
    helperLine: 'Sign in to practice and save your interview results.',
    href: '#interview',
  },
];

const CoreActionsSection: React.FC = () => {
  return (
    <section className="relative -mt-24 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="grid md:grid-cols-3 gap-6">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div key={index} className="bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-neutral-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <div className={`w-14 h-14 ${action.bg} rounded-xl flex items-center justify-center mb-6 shrink-0`}>
                <Icon className={`w-7 h-7 ${action.color}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{action.title}</h3>
              <p className="text-gray-600 dark:text-neutral-400 mb-8 leading-relaxed flex-1">
                {action.description}
              </p>
              
              <div className="flex flex-col items-start gap-1.5 mt-auto">
                <a href={action.href} className={`inline-flex items-center gap-2 font-bold text-lg ${action.color} hover:gap-3 transition-all`}>
                  {action.cta}
                  <ArrowRight className="w-5 h-5 shrink-0" />
                </a>
                {action.helperLine && (
                  <p className="text-sm text-gray-500 dark:text-neutral-500 font-medium">
                    {action.helperLine}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CoreActionsSection;
