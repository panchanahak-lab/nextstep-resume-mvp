import React from 'react';
import { Gift } from 'lucide-react';

const ShareReferralSection: React.FC = () => {
  return (
    <section className="py-20 bg-blue-600 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-4">
          Help your friends get hired too.
        </h2>
        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
          Share NextStep with friends and unlock free ATS scans for both of you.
        </p>
        <button className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors shadow-xl">
          Share on WhatsApp
        </button>
      </div>
    </section>
  );
};

export default ShareReferralSection;
