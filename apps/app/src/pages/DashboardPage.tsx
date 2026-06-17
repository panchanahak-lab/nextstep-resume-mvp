import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../../packages/shared/src/components/Card';
import Button from '../../../../packages/shared/src/components/Button';
import StatCard from '../../../../packages/shared/src/components/StatCard';
import { mockActivityItems } from '../data/mockData';
import { COPY } from '@nextstep/shared';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{COPY.DASHBOARD.welcome}</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">{COPY.DASHBOARD.supportText}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Resumes Created"
          value={3}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          }
        />
        <StatCard
          title="Resumes Scanned"
          value={5}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
        />
        <StatCard
          title="Mock Interviews"
          value={2}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Current Package"
          value="Free"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => navigate('/builder')}>{COPY.BUTTONS.RESUME.build}</Button>
          <Button variant="secondary" onClick={() => navigate('/scanner')}>{COPY.BUTTONS.RESUME.scan}</Button>
          <Button variant="secondary" onClick={() => navigate('/interview')}>{COPY.BUTTONS.INTERVIEW.start}</Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{COPY.DASHBOARD.recentActivity}</h2>
        <Card className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {mockActivityItems.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-start gap-4 p-4 ${
                index % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50 dark:bg-neutral-900/50'
              }`}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                {item.type === 'resume' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )}
                {item.type === 'scan' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                )}
                {item.type === 'interview' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.title}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.description}</p>
              </div>
              <span className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">{item.date}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
