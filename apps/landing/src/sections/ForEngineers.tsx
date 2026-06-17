import React from 'react';

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const bulletPoints = [
  'Domain-specific interview questions',
  'Focus on project execution and delivery',
  'Mechanical and infrastructure terminology',
  'Data center project and operations scenarios',
  'Resume language suitable for technical roles',
  'Tailored for Indian job seekers and technical professionals',
];

const ForEngineers: React.FC = () => {
  return (
    <section id="for-engineers" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Left column */}
          <div className="lg:w-1/2">
            <h2 className="text-3xl font-bold text-neutral-900">
              Built for Engineers &amp; Data Center Professionals
            </h2>
            <p className="text-neutral-600 mt-4 text-lg leading-relaxed">
              Unlike generic resume tools, NextStep understands the language of engineering.
              From mechanical design to data center operations, our platform is built to help
              technical professionals present their experience in the most impactful way —
              with terminology, templates, and interview scenarios tailored to your domain.
            </p>
          </div>

          {/* Right column */}
          <div className="lg:w-1/2">
            <ul className="space-y-4">
              {bulletPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-neutral-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForEngineers;
