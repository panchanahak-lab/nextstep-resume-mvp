import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../../packages/shared/src/components/Card';
import Button from '../../../../packages/shared/src/components/Button';
import StatCard from '../../../../packages/shared/src/components/StatCard';
import { COPY, getSupabaseClient } from '@nextstep/shared';

interface ActivityItem {
  id: string;
  type: 'scan' | 'interview';
  title: string;
  description: string;
  date: string;
  timestamp: number;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    scans: 0,
    interviews: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch scans
        const { data: scansData } = await supabase
          .from('scans')
          .select('id, mode, score, created_at')
          .eq('user_id', user.id);

        // Fetch interviews
        const { data: interviewsData } = await supabase
          .from('interviews')
          .select('id, job_role, score, created_at')
          .eq('user_id', user.id);

        const sData = scansData || [];
        const iData = interviewsData || [];

        setStats({
          scans: sData.length,
          interviews: iData.length
        });

        const combined: ActivityItem[] = [
          ...sData.map(s => ({
            id: `scan-${s.id}`,
            type: 'scan' as const,
            title: 'Resume Scan',
            description: `Scanned for ${s.mode} - Score: ${s.score}`,
            date: new Date(s.created_at).toLocaleDateString(),
            timestamp: new Date(s.created_at).getTime()
          })),
          ...iData.map(i => ({
            id: `int-${i.id}`,
            type: 'interview' as const,
            title: 'Mock Interview',
            description: `Role: ${i.job_role} - Score: ${i.score}`,
            date: new Date(i.created_at).toLocaleDateString(),
            timestamp: new Date(i.created_at).getTime()
          }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5); // top 5 recent

        setActivities(combined);

      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
          value={localStorage.getItem('nextstep_resume') ? 1 : 0}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          }
        />
        <StatCard
          title="Resumes Scanned"
          value={loading ? '-' : stats.scans}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
        />
        <StatCard
          title="Mock Interviews"
          value={loading ? '-' : stats.interviews}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Current Package"
          value="Basic"
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
          {loading ? (
            <div className="p-8 text-center text-neutral-500">Loading activity...</div>
          ) : activities.length > 0 ? (
            activities.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 p-4 ${
                  index % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50 dark:bg-neutral-900/50'
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
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
            ))
          ) : (
             <div className="p-8 text-center text-neutral-500">No recent activity found. Start a mock interview or scan a resume!</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
