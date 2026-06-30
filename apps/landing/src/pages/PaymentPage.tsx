import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, LockKeyhole, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useTheme } from '@nextstep/shared';
import markUrl from '../assets/nextstep-mark.png';

const planBenefits = [
  'AI-powered resume builder',
  'Intelligent mock interviews',
  'Unlimited AI scans',
  'Priority support',
];

const Logo: React.FC = () => (
  <Link to="/" className="ns-logo" aria-label="NextStep home">
    <img src={markUrl} alt="" />
    <span>
      <span className="text-primary-600 dark:text-primary-500">NextStep</span>{' '}
      <span className="text-neutral-900 dark:text-white">Resume</span>
    </span>
  </Link>
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

const PaymentPage: React.FC = () => {
  const [method, setMethod] = useState<'upi' | 'card'>('upi');
  const dueToday = useMemo(() => {
    const subtotal = 499;
    const gst = subtotal * 0.18;
    return { subtotal, gst, total: subtotal + gst };
  }, []);

  return (
    <div className="ns-page">
      <header className="ns-header">
        <Logo />
        <nav aria-label="Primary navigation">
          <Link to="/#features">Features</Link>
          <Link to="/#how-it-works">How it works</Link>
          <Link to="/#pricing">Pricing</Link>
        </nav>
        <div className="ns-header-actions">
          <ThemeSwitch />
          <Link className="ns-link-button" to="/">Back</Link>
        </div>
      </header>

      <main className="ns-payment-page">
        <section className="ns-payment-column">
          <h1>Order Summary</h1>
          <article className="ns-summary-card">
            <div className="ns-summary-head">
              <strong>Pro Plan - Monthly</strong>
              <span>₹499/month</span>
            </div>
            <h2>Benefits</h2>
            <ul>
              {planBenefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
            </ul>
            <div className="ns-total-box">
              <div><span>Subtotal</span><strong>₹{dueToday.subtotal.toFixed(0)}</strong></div>
              <div><span>GST (18%)</span><strong>₹{dueToday.gst.toFixed(2)}</strong></div>
              <div><span>Due today</span><strong>₹{dueToday.total.toFixed(2)}</strong></div>
            </div>
          </article>
          <div className="ns-guarantee-badge">
            <ShieldCheck className="h-8 w-8" aria-hidden="true" />
            <strong>30-Day</strong>
            <span>Money-back guarantee</span>
          </div>
        </section>

        <section className="ns-payment-column">
          <h1>Secure Payment <LockKeyhole className="inline-block h-6 w-6" aria-hidden="true" /></h1>
          <article className="ns-payment-card">
            <h2>Select payment method</h2>
            <div className="ns-method-tabs">
              <button className={method === 'upi' ? 'active' : ''} type="button" onClick={() => setMethod('upi')}>UPI</button>
              <button className={method === 'card' ? 'active' : ''} type="button" onClick={() => setMethod('card')}>Card</button>
            </div>
            {method === 'upi' ? (
              <div className="ns-payment-form">
                <label>
                  UPI ID
                  <input placeholder="yourname@upi" />
                </label>
                <div className="ns-payment-icons">
                  <span>GPay</span>
                  <span>PhonePe</span>
                  <span>Paytm</span>
                  <span>BHIM</span>
                </div>
              </div>
            ) : (
              <div className="ns-payment-form">
                <label>
                  Card number
                  <div className="ns-input-icon">
                    <CreditCard className="h-5 w-5" aria-hidden="true" />
                    <input placeholder="1234 5678 9012 1123" />
                  </div>
                </label>
                <div className="ns-two-fields">
                  <label>
                    Expiry
                    <input placeholder="MM/YY" />
                  </label>
                  <label>
                    CVV
                    <input placeholder="123" />
                  </label>
                </div>
                <label>
                  Name on card
                  <input placeholder="Rahul Anand" />
                </label>
              </div>
            )}
            <button className="ns-primary-button wide" type="button">Complete payment</button>
          </article>
          <div className="ns-razorpay-strip">Payment powered by <strong>Razorpay</strong></div>
        </section>
      </main>

      <footer className="ns-footer">
        <Logo />
        <nav aria-label="Footer navigation">
          <Link to="/#features">Features</Link>
          <Link to="/#how-it-works">How it works</Link>
          <Link to="/#pricing">Pricing</Link>
        </nav>
      </footer>
    </div>
  );
};

export default PaymentPage;
