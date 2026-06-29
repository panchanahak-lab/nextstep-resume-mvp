import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../../packages/shared/src/components/Card';
import Button from '../../../../packages/shared/src/components/Button';
import StatCard from '../../../../packages/shared/src/components/StatCard';
import { COPY, getSupabaseClient } from '@nextstep/shared';
import { isResumeDataEmpty, loadStoredResume } from '../utils/resumeStorage';

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
    resumes: 0,
    scans: 0,
    interviews: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [greetingInfo, setGreetingInfo] = useState({ name: '', isFirstLogin: true });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();

        const displayName = profile?.full_name
          || user.user_metadata?.full_name
          || user.user_metadata?.name
          || (user.email ? user.email.split('@')[0] : '');

        const firstName = displayName ? displayName.split(' ')[0] : '';
        const capitalizedName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : '';

        const created = new Date(user.created_at || '').getTime();
        const lastSignIn = new Date(user.last_sign_in_at || '').getTime();
        const isFirst = isNaN(lastSignIn) || isNaN(created) || (lastSignIn - created < 10000);
        
        setGreetingInfo({ name: capitalizedName, isFirstLogin: isFirst });

        // Fetch usage counts from the current production tables.
        const [
          { data: scansData, error: scansError },
          { data: interviewsData, error: interviewsError },
          { count: resumeDraftCount, error: resumeDraftsError },
        ] = await Promise.all([
          supabase
            .from('ats_scans')
            .select('id, final_score, confidence_level, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('interviews')
            .select('id, job_role, score, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('resume_drafts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);

        if (scansError) console.error('Failed to fetch ATS scan count', scansError);
        if (interviewsError) console.error('Failed to fetch interview count', interviewsError);
        if (resumeDraftsError) console.error('Failed to fetch resume draft count', resumeDraftsError);

        const { count: scanCount } = await supabase
          .from('ats_scans')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const { count: interviewCount } = await supabase
          .from('interviews')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const sData = scansData || [];
        const iData = interviewsData || [];
        const localResume = loadStoredResume(user.id);
        const hasLocalResume = Boolean(localResume && !isResumeDataEmpty(localResume));
        const resumesCreated = Math.max(resumeDraftCount || 0, hasLocalResume ? 1 : 0);

        setStats({
          resumes: resumesCreated,
          scans: scanCount || sData.length,
          interviews: interviewCount || iData.length
        });

        const combined: ActivityItem[] = [
          ...sData.map(s => ({
            id: `scan-${s.id}`,
            type: 'scan' as const,
            title: 'Resume Scan',
            description: `Score: ${s.final_score}/100${s.confidence_level ? ` - ${s.confidence_level} confidence` : ''}`,
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
    <div className="space-y-8">
      <section className="app-hero-card p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="app-pill">AI-powered career readiness</span>
            <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight text-neutral-950 dark:text-white sm:text-4xl lg:text-5xl">
              {greetingInfo.isFirstLogin 
                ? `Welcome${greetingInfo.name ? ` ${greetingInfo.name}` : ''}. Your next step is ready.` 
                : `Welcome back${greetingInfo.name ? `, ${greetingInfo.name}` : ''}. Your next step is ready.`}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 app-muted">
              Keep building from the same flow you started on the landing page: improve your resume, scan it for ATS, and practice interviews before applying.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="primary" size="lg" onClick={() => navigate('/scanner')}>Scan Resume</Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/interview')}>Start AI Mock Interview</Button>
            </div>
          </div>

          <div className="app-panel rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold app-muted">Career score preview</p>
                <p className="mt-1 text-4xl font-extrabold text-neutral-950 dark:text-white">72<span className="text-lg app-muted">/100</span></p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-600 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm app-muted">Resume readiness</span>
                <strong className="app-green">Good start</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm app-muted">Interview practice</span>
                <strong className="text-primary-300">{loading ? '-' : stats.interviews} done</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div>
        <h2 className="text-lg font-bold text-neutral-950 dark:text-white">Progress overview</h2>
        <p className="mt-1 app-muted">{COPY.DASHBOARD.supportText}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Resumes Created"
          value={loading ? '-' : stats.resumes}
          className="app-card"
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
          className="app-card"
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
          className="app-card"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Current Package"
          value="Basic"
          className="app-card"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          }
        />
      </div>

      {/* Career Tools */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="app-card p-5 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="app-icon-tile flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 10h.01" />
                <path d="M12 10h.01" />
                <path d="M16 10h.01" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-300">AI Mock Interview</p>
              <h2 className="mt-1 text-xl font-bold text-neutral-950 dark:text-white">Practice interview questions for your target role</h2>
              <p className="mt-2 text-sm app-muted">
                Choose your role, upload your resume, answer realistic questions, and get a score with improvement tips.
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={() => navigate('/interview')} className="sm:self-center whitespace-nowrap">
              Start Interview
            </Button>
          </div>
        </Card>

        <Card className="app-card p-5">
          <h3 className="text-base font-semibold text-neutral-950 dark:text-white">Interview history</h3>
          <p className="mt-2 text-sm app-muted">
            {loading ? 'Loading...' : `${stats.interviews} completed practice round${stats.interviews === 1 ? '' : 's'}`}
          </p>
          <Button variant="secondary" className="mt-4 w-full" onClick={() => navigate('/interview')}>
            View Practice Area
          </Button>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-neutral-950 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <button className="app-action-card text-left" type="button" onClick={() => navigate('/builder')}>
            <span className="app-icon-tile mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </span>
            <strong className="block text-neutral-950 dark:text-white">{COPY.BUTTONS.RESUME.build}</strong>
            <span className="mt-1 block text-sm app-muted">Create a polished resume with guided sections.</span>
          </button>
          <button className="app-action-card text-left" type="button" onClick={() => navigate('/scanner')}>
            <span className="app-icon-tile mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <strong className="block text-neutral-950 dark:text-white">{COPY.BUTTONS.RESUME.scan}</strong>
            <span className="mt-1 block text-sm app-muted">Find ATS gaps and improve your match score.</span>
          </button>
          <button className="app-action-card text-left" type="button" onClick={() => navigate('/interview')}>
            <span className="app-icon-tile mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <strong className="block text-neutral-950 dark:text-white">{COPY.BUTTONS.INTERVIEW.start}</strong>
            <span className="mt-1 block text-sm app-muted">Practice realistic questions and save results.</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-neutral-950 dark:text-white mb-4">{COPY.DASHBOARD.recentActivity}</h2>
        <Card className="app-card divide-y divide-white/10">
          {loading ? (
            <div className="p-8 text-center app-muted">Loading activity...</div>
          ) : activities.length > 0 ? (
            activities.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 p-4 ${index % 2 === 0 ? 'bg-white/0' : 'bg-white/5'}`}
              >
                <div className="app-icon-tile flex-shrink-0 w-10 h-10">
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
                  <p className="text-sm font-semibold text-neutral-950 dark:text-white">{item.title}</p>
                  <p className="text-sm app-muted">{item.description}</p>
                </div>
                <span className="text-xs app-muted whitespace-nowrap">{item.date}</span>
              </div>
            ))
          ) : (
             <div className="p-8 text-center app-muted">No recent activity found. Start a mock interview or scan a resume!</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
