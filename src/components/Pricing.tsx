import React, { useState } from 'react';
import { createRazorpayOrder, verifyRazorpayPayment } from '../lib/aiClient';

interface PricingProps {
  isLoggedIn: boolean;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

const packs = [
  {
    id: 'resume_pack_29',
    name: 'Resume Pack',
    price: '₹29',
    description: 'ATS scan, AI improvement plan, summary, and resume-ready fixes.',
    features: ['ATS score out of 100', 'AI resume improvement', 'Personalized summary'],
  },
  {
    id: 'interview_pack_29',
    name: 'Interview Pack',
    price: '₹29',
    description: 'Mock interview scoring with feedback, strengths, weaknesses, and answers.',
    features: ['Interview score', 'Line feedback', 'Suggested answers'],
  },
  {
    id: 'job_ready_pack_49',
    name: 'Get Job Ready Pack',
    price: '₹49',
    description: 'Resume and interview preparation in one focused bundle.',
    features: ['Resume Pack included', 'Interview Pack included', 'Priority practice flow'],
    isPopular: true,
  },
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const Pricing: React.FC<PricingProps> = ({ isLoggedIn, onOpenAuth }) => {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const startCheckout = async (packageId: string) => {
    if (!isLoggedIn) {
      onOpenAuth('signin');
      return;
    }

    setLoadingPack(packageId);
    setMessage('');

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) throw new Error('Razorpay checkout failed to load.');

      const order = await createRazorpayOrder(packageId);
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        theme: { color: '#00649E' },
        handler: async (response: any) => {
          await verifyRazorpayPayment({
            paymentId: order.paymentId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setMessage('Package access activated in test mode.');
          setLoadingPack(null);
        },
        modal: {
          ondismiss: () => setLoadingPack(null),
        },
      });
      checkout.open();
    } catch (error: any) {
      setMessage(error.message || 'Payment setup failed. Check Razorpay test credentials.');
      setLoadingPack(null);
    }
  };

  return (
    <section id="pricing" className="py-20 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-brand-500 font-semibold tracking-wide uppercase text-sm">Test Payments</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy-900 mt-2">Choose a Job-Ready Pack</h2>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto">Razorpay test checkout is wired through secure Supabase Edge Functions. Package access is granted after signature verification.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <div key={pack.id} className={`relative bg-white border rounded-xl p-6 shadow-sm ${pack.isPopular ? 'border-brand-500 shadow-lg' : 'border-slate-200'}`}>
              {pack.isPopular && <span className="absolute -top-3 left-6 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">Best Value</span>}
              <h3 className="font-heading text-xl font-bold text-navy-900">{pack.name}</h3>
              <div className="mt-3 text-4xl font-bold text-navy-900">{pack.price}</div>
              <p className="text-sm text-slate-600 mt-3 min-h-[60px]">{pack.description}</p>
              <ul className="mt-5 space-y-2">
                {pack.features.map((feature) => (
                  <li key={feature} className="text-sm text-slate-700 flex gap-2">
                    <i className="fas fa-check-circle text-brand-500 mt-0.5"></i>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => startCheckout(pack.id)}
                disabled={loadingPack === pack.id}
                className="mt-6 w-full bg-navy-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-60"
              >
                {loadingPack === pack.id ? 'Opening Checkout...' : 'Buy in Test Mode'}
              </button>
            </div>
          ))}
        </div>

        {message && (
          <div className="mt-6 bg-brand-50 border border-brand-100 text-brand-700 rounded-lg px-4 py-3 text-sm text-center">
            {message}
          </div>
        )}
      </div>
    </section>
  );
};

export default Pricing;
