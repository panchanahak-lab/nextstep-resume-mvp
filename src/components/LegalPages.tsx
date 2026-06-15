import React from 'react';

const LegalPages: React.FC = () => {
  return (
    <section className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-3 gap-8">
        <div id="privacy" className="scroll-mt-24">
          <h2 className="font-heading text-2xl font-bold text-navy-900">Privacy Policy</h2>
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">
            NextStep Resume uses your resume, job descriptions, and interview transcripts only to provide requested AI feedback. Gemini requests are routed through secure Supabase Edge Functions. Payment secrets and Gemini credentials remain server-side.
          </p>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            You can request deletion of saved resumes, reports, and usage records by contacting support. Do not upload resumes containing information you are not authorized to share.
          </p>
        </div>

        <div id="terms" className="scroll-mt-24">
          <h2 className="font-heading text-2xl font-bold text-navy-900">Terms</h2>
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">
            AI feedback is career guidance, not a hiring guarantee. Resume scores and interview scores are estimates generated from your submitted information and should be reviewed before use.
          </p>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Test payments are for MVP validation. Live payment processing requires production Razorpay keys, webhook verification, and final legal review.
          </p>
        </div>

        <div id="contact" className="scroll-mt-24">
          <h2 className="font-heading text-2xl font-bold text-navy-900">Contact</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p><span className="font-bold text-navy-900">Support:</span> support@nextstepresume.ai</p>
            <p><span className="font-bold text-navy-900">Privacy:</span> privacy@nextstepresume.ai</p>
            <p><span className="font-bold text-navy-900">Response time:</span> 1-2 business days during MVP testing.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LegalPages;
