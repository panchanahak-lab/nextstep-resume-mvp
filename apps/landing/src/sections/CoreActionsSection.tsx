import React from 'react';
import { FileText, ScanSearch, UserSquare2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const actions = [
  {
    title: 'Create Resume',
    description: 'Build a professional resume with guided examples and ready-to-download PDF formats.',
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    cta: 'Build Resume',
    href: '#builder',
  },
  {
    title: 'Scan Resume',
    description: 'Check ATS score, missing keywords, and line-by-line fixes before you apply.',
    icon: ScanSearch,
    color: 'text-green-600',
    bg: 'bg-green-50',
    cta: 'Scan My Resume',
    href: '#scan',
  },
  {
    title: 'Live AI Mock Interview',
    description: 'Practice speaking with AI, get scored feedback, and improve before the real interview.',
    icon: UserSquare2,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    cta: 'Start Interview',
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
            <div key={index} className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-14 h-14 ${action.bg} rounded-xl flex items-center justify-center mb-6`}>
                <Icon className={`w-7 h-7 ${action.color}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{action.title}</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {action.description}
              </p>
              <a href={action.href} className={`inline-flex items-center gap-2 font-semibold ${action.color} hover:gap-3 transition-all`}>
                {action.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CoreActionsSection;
