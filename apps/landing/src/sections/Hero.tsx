import React from 'react';
import { Badge } from '../../../../packages/shared/src/components/Badge';
import { Button } from '../../../../packages/shared/src/components/Button';

const Hero: React.FC = () => {
  return (
    <section id="hero" className="bg-gradient-to-br from-neutral-50 to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col lg:flex-row items-center gap-12">
        {/* Left side */}
        <div className="lg:w-1/2 text-center lg:text-left">
          <Badge variant="primary" className="inline-flex items-center gap-1.5 mb-6">
            🚀 AI-Powered Career Tools
          </Badge>

          <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight">
            AI Resume Platform for Engineers &amp; Data Center Professionals
          </h1>

          <p className="text-lg text-neutral-600 mt-4 max-w-xl">
            Build, scan, and practice interviews with AI — focused on engineering and data center roles.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 justify-center lg:justify-start">
            <a href="http://localhost:3001">
              <Button variant="primary" size="lg">
                Start for Free →
              </Button>
            </a>
            <a href="http://localhost:3001/profile">
              <Button variant="secondary" size="lg">
                View My Resume
              </Button>
            </a>
          </div>

          <p className="text-sm text-neutral-500 mt-4">
            ✓ No credit card required&nbsp;&nbsp;✓ Free preview available
          </p>
        </div>

        {/* Right side — Tailwind-only mock dashboard */}
        <div className="lg:w-1/2 w-full max-w-lg mx-auto lg:mx-0">
          <div className="rounded-xl shadow-2xl overflow-hidden border border-neutral-200 bg-white">
            <div className="flex h-72 sm:h-80">
              {/* Sidebar */}
              <div className="w-14 bg-neutral-900 flex flex-col items-center py-4 gap-3 shrink-0">
                <div className="w-7 h-7 rounded-md bg-primary-500" />
                <div className="w-7 h-7 rounded-md bg-neutral-700" />
                <div className="w-7 h-7 rounded-md bg-neutral-700" />
                <div className="w-7 h-7 rounded-md bg-neutral-700" />
                <div className="mt-auto w-7 h-7 rounded-full bg-neutral-600" />
              </div>

              {/* Main content area */}
              <div className="flex-1 flex flex-col">
                {/* Header bar */}
                <div className="h-10 bg-neutral-100 border-b border-neutral-200 flex items-center px-4 gap-2">
                  <div className="w-20 h-3 rounded bg-neutral-300" />
                  <div className="ml-auto w-24 h-6 rounded-md bg-primary-500" />
                </div>

                {/* Content */}
                <div className="flex-1 p-4 space-y-4">
                  {/* Stat cards row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-primary-50 border border-primary-200 p-3">
                      <div className="w-6 h-2 rounded bg-primary-400 mb-2" />
                      <div className="w-10 h-4 rounded bg-primary-500" />
                    </div>
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <div className="w-6 h-2 rounded bg-green-400 mb-2" />
                      <div className="w-10 h-4 rounded bg-green-500" />
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <div className="w-6 h-2 rounded bg-amber-400 mb-2" />
                      <div className="w-10 h-4 rounded bg-amber-500" />
                    </div>
                  </div>

                  {/* Resume preview area */}
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-2">
                    <div className="w-32 h-3 rounded bg-neutral-400" />
                    <div className="w-full h-2 rounded bg-neutral-200" />
                    <div className="w-5/6 h-2 rounded bg-neutral-200" />
                    <div className="w-4/6 h-2 rounded bg-neutral-200" />
                    <div className="w-full h-2 rounded bg-neutral-200 mt-3" />
                    <div className="w-3/4 h-2 rounded bg-neutral-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
