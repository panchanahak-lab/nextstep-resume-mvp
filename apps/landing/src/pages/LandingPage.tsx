import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileUp, LockKeyhole, Moon, ShieldCheck, Sparkles, Sun } from 'lucide-react';
import { useTheme } from '@nextstep/shared';
import markUrl from '../assets/nextstep-mark.png';

const findings = [
  {
    title: 'Add measurable achievements',
    body: 'Include numbers and outcomes to prove your impact.',
    impact: 'High impact',
  },
  {
    title: 'Strengthen your summary',
    body: 'Make your value proposition clear in 3-4 lines.',
    impact: 'Medium impact',
  },
  {
    title: 'Improve keyword match',
    body: 'Add role-specific keywords to pass ATS filters.',
    impact: 'Medium impact',
  },
];

const paths = [
  {
    id: 'scan',
    title: 'Scan my resume',
    body: 'Get an AI score and actionable feedback in under a minute.',
    time: '1-2 min',
    recommended: true,
  },
  {
    id: 'build',
    title: 'Build a new resume',
    body: 'Create a job-winning resume with AI guidance.',
    time: '10-15 min',
  },
  {
    id: 'practice',
    title: 'Practice interview',
    body: 'Practice with AI and get real-time feedback.',
    time: '15-20 min',
  },
];

const plans = [
  {
    name: 'Free',
    price: '₹0',
    description: 'Try NextStep and see the difference.',
    benefits: ['1 resume scan', 'Basic resume builder', 'Sample AI mock interview'],
    cta: 'Start free',
  },
  {
    name: 'Pro',
    price: '₹499',
    description: 'Everything you need to get more interviews.',
    benefits: ['Unlimited resume scans', 'AI resume rewrites', 'Unlimited mock interviews', 'Export in PDF and Word'],
    cta: 'Get Pro',
    featured: true,
  },
  {
    name: 'Premium',
    price: '₹999',
    description: 'Advanced tools to accelerate your job search.',
    benefits: ['Everything in Pro', 'AI cover letters', 'Job tracker and manager', 'Priority insights'],
    cta: 'Go Premium',
  },
];

const Logo: React.FC = () => (
  <div className="ns-logo" aria-label="NextStep">
    <img src={markUrl} alt="" />
    <span>NextStep</span>
  </div>
);

const ThemeSwitch: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button className="ns-theme-switch" type="button" onClick={toggleTheme} aria-label={`Switch to ${isDark ? 'day' : 'night'} theme`}>
      <span className="ns-theme-track" aria-hidden="true">
        <span className="ns-theme-knob" />
      </span>
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span>{isDark ? 'Night' : 'Day'}</span>
    </button>
  );
};

const ScoreRing: React.FC<{ value?: number }> = ({ value = 72 }) => (
  <div className="ns-score-ring" style={{ '--score': `${value * 3.6}deg` } as React.CSSProperties} aria-label={`Resume score ${value} out of 100`}>
    <div>
      <strong>{value}</strong>
      <span>/100</span>
    </div>
  </div>
);

const FindingList: React.FC = () => (
  <div className="ns-finding-list">
    {findings.map((finding) => (
      <button className="ns-finding-row" type="button" key={finding.title}>
        <Sparkles className="ns-row-icon" aria-hidden="true" />
        <span>
          <strong>{finding.title}</strong>
          <small>{finding.body}</small>
        </span>
        <em>{finding.impact}</em>
      </button>
    ))}
  </div>
);

const Header: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => (
  <header className="ns-header">
    <Logo />
    <nav aria-label="Primary navigation">
      <a href="#features">Features</a>
      <a href="#how-it-works">How it works</a>
      <a href="#pricing">Pricing</a>
    </nav>
    <div className="ns-header-actions">
      <ThemeSwitch />
      <button type="button" className="ns-link-button" onClick={onUnlock}>Log in</button>
      <button type="button" className="ns-primary-button" onClick={onUnlock}>Sign up</button>
    </div>
  </header>
);

const UnlockModal: React.FC<{ open: boolean; onClose: () => void; onContinue: () => void }> = ({ open, onClose, onContinue }) => {
  const [selected, setSelected] = useState('scan');

  if (!open) return null;

  return (
    <div className="ns-modal-backdrop" role="presentation">
      <section className="ns-unlock-modal" role="dialog" aria-modal="true" aria-labelledby="unlock-title">
        <button className="ns-close-button" type="button" onClick={onClose} aria-label="Close unlock flow">x</button>
        <div className="ns-modal-title">
          <h2 id="unlock-title">Choose your fastest path to better interviews</h2>
          <p>Pick a goal and we'll personalize your experience.</p>
        </div>

        <div className="ns-unlock-grid">
          <div className="ns-path-list">
            {paths.map((path) => (
              <button className={`ns-path-card ${selected === path.id ? 'selected' : ''}`} type="button" onClick={() => setSelected(path.id)} key={path.id}>
                <FileUp className="ns-path-icon" aria-hidden="true" />
                <span>
                  <strong>{path.title}</strong>
                  {path.recommended && <em>Recommended</em>}
                  <small>{path.body}</small>
                  <b>{path.time}</b>
                </span>
              </button>
            ))}
          </div>

          <article className="ns-scan-preview">
            <div className="ns-card-header">
              <span>Your scan preview</span>
              <small>Sample results</small>
            </div>
            <div className="ns-score-summary compact">
              <ScoreRing />
              <div>
                <h3>Good start.</h3>
                <p>Improve a few areas to stand out to recruiters.</p>
              </div>
            </div>
            <FindingList />
            <div className="ns-locked-box">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              <div>
                <strong>Detailed report is locked</strong>
                <span>Create a free account to unlock your full report, AI suggestions, and priority actions.</span>
              </div>
            </div>
          </article>
        </div>

        <div className="ns-account-bar">
          <strong>Create your free account to save your results</strong>
          <div className="ns-account-controls">
            <button className="ns-secondary-button" type="button">Continue with Google</button>
            <input aria-label="Email address" placeholder="Enter your email" />
            <button className="ns-primary-button" type="button" onClick={onContinue}>Continue free</button>
          </div>
          <p>First scan included · No credit card needed · Your resume stays private</p>
        </div>
      </section>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const [unlockOpen, setUnlockOpen] = useState(false);
  const navigate = useNavigate();

  const openUnlock = () => setUnlockOpen(true);
  const closeUnlock = () => setUnlockOpen(false);
  const goToPayment = () => navigate('/payment');

  return (
    <div className="ns-page">
      <Header onUnlock={openUnlock} />
      <main>
        <section className="ns-hero" id="features">
          <div className="ns-hero-copy">
            <div className="ns-eyebrow">AI-powered resume builder, scanner and mock interviews</div>
            <h1>Land your dream job faster with NextStep AI</h1>
            <p>Upload your resume, get an instant score, and know exactly what to improve before your next application.</p>

            <div className="ns-upload-panel">
              <FileUp className="ns-upload-icon" aria-hidden="true" />
              <strong>Drop your resume here</strong>
              <small>PDF or DOCX up to 10MB</small>
              <button className="ns-primary-button wide" type="button" onClick={openUnlock}>Choose file</button>
              <button className="ns-secondary-button wide" type="button" onClick={openUnlock}>Try sample scan</button>
            </div>

            <div className="ns-trust-strip">
              <span><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> First scan free</span>
              <span><ShieldCheck className="h-4 w-4" aria-hidden="true" /> No credit card</span>
              <span><LockKeyhole className="h-4 w-4" aria-hidden="true" /> Private by default</span>
            </div>
          </div>

          <article className="ns-score-card">
            <div className="ns-card-header">
              <span>Your Resume Score</span>
              <button type="button">What's this?</button>
            </div>
            <div className="ns-score-summary">
              <ScoreRing />
              <div>
                <h2>Good start.</h2>
                <p>You're on the right track. Improve the areas below to stand out and get more interviews.</p>
              </div>
            </div>
            <FindingList />
            <p className="ns-locked-note">Detailed report is available after you create your account.</p>
          </article>
        </section>

        <section className="ns-comparison-band" id="how-it-works">
          <div className="ns-section-title">
            <span>See the difference</span>
            <h2>From average to interview-ready</h2>
            <p>AI-driven suggestions that make a real impact.</p>
          </div>
          <div className="ns-resume-compare">
            <div className="ns-resume-sheet before">
              <span>Before</span>
              <h3>Needs improvement</h3>
              <div className="ns-paper-lines" />
              <strong>48/100</strong>
            </div>
            <div className="ns-compare-arrow">Next</div>
            <div className="ns-resume-sheet after">
              <span>After</span>
              <h3>Interview-ready</h3>
              <div className="ns-paper-lines" />
              <strong>85/100</strong>
            </div>
          </div>
        </section>

        <section className="ns-pricing-section" id="pricing">
          <div className="ns-section-title">
            <h2>Choose the plan that gets you hired</h2>
            <p>Start free. Upgrade anytime. Cancel anytime.</p>
          </div>

          <div className="ns-plan-grid">
            {plans.map((plan) => (
              <article className={`ns-plan-card ${plan.featured ? 'featured' : ''}`} key={plan.name}>
                {plan.featured && <span className="ns-popular">Most popular</span>}
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <strong>{plan.price}<small>/month</small></strong>
                <ul>
                  {plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
                </ul>
                <button className={plan.featured ? 'ns-primary-button wide' : 'ns-secondary-button wide'} type="button" onClick={goToPayment}>{plan.cta}</button>
                <small>{plan.name === 'Free' ? 'No credit card for Free' : 'Cancel anytime'}</small>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="ns-footer">
        <Logo />
        <nav aria-label="Footer navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
        </nav>
      </footer>

      <UnlockModal open={unlockOpen} onClose={closeUnlock} onContinue={goToPayment} />
    </div>
  );
};

export default LandingPage;
