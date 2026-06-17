import React from 'react';

const Founder: React.FC = () => {
  return (
    <section id="founder" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-2xl font-bold shadow-sm">
              EP
            </div>
          </div>

          <h2 className="text-2xl font-bold text-neutral-900">
            Built by a Mechanical / Data Center Project Engineer
          </h2>

          <p className="text-neutral-600 mt-4 leading-relaxed">
            NextStep was built by an engineer who understands the challenges of technical
            hiring. With years of experience in mechanical engineering and data center
            projects, this platform is designed to help Indian engineers and technical
            professionals present their skills effectively and ace their interviews.
          </p>

          <p className="font-bold text-neutral-900 mt-6">Engineering Professional</p>
          <p className="text-sm text-neutral-500 mt-1">
            Mechanical Engineer | Data Center Projects
          </p>
        </div>
      </div>
    </section>
  );
};

export default Founder;
