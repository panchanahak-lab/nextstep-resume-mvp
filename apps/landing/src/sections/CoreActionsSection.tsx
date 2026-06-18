import React from 'react';
import { FileText, ScanSearch, UserSquare2, ArrowRight } from 'lucide-react';
import { APP_ROUTES } from '@nextstep/shared';
import { useAuthActions } from '../context/AuthActionContext';

const actions = [
  {
    title: 'Create Resume',
    description: 'Sign in to save and download your resume.',
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    cta: 'Build Your Resume',
    route: APP_ROUTES.builder,
  },
  {
    title: 'Scan Resume',
    description: 'First-time users get 1 ATS scan included after signup.',
    icon: ScanSearch,
    color: 'text-green-600',
    bg: 'bg-green-50',
    cta: 'Scan Your CV',
    route: APP_ROUTES.scanner,
  },
  {
    title: 'Live AI Mock Interview',
    description: 'Sign in to practice and save your interview results.',
    icon: UserSquare2,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    cta: 'Start Mock Interview',
    route: APP_ROUTES.interview,
  },
];

const CoreActionsSection: React.FC = () => {
  const { goToProtectedRoute } = useAuthActions();

  return (
    <section className="relative -mt-24 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="grid md:grid-cols-3 gap-6">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => goToProtectedRoute(action.route)}
              className="group bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left"
            >
              <div className={`w-14 h-14 ${action.bg} rounded-xl flex items-center justify-center mb-6`}>
                <Icon className={`w-7 h-7 ${action.color}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{action.title}</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {action.description}
              </p>
              <span className={`inline-flex items-center gap-2 font-semibold ${action.color} group-hover:gap-3 transition-all`}>
                {action.cta}
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CoreActionsSection;
