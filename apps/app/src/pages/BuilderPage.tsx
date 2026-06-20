import React, { useState, useEffect, useCallback } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { ResumeData } from '../../../../packages/shared/src/types';
import { COPY } from '@nextstep/shared';
import Button from '../../../../packages/shared/src/components/Button';
import ResumeForm from '../components/ResumeForm';
import ResumePreview from '../components/ResumePreview';
import { mockResumeData } from '../data/mockData';

const STORAGE_KEY = 'nextstep_resume_autosave';

const BuilderPage: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved resume', e);
    }
    return mockResumeData;
  });

  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');

  // Debounced save to localStorage
  useEffect(() => {
    setSaveState('saving');
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));
      setSaveState('saved');
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [resumeData]);

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{COPY.BUILDER.headline}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">{COPY.BUILDER.supportText}</p>
          <p className="text-sm text-primary-600 font-medium mt-1">{COPY.BUILDER.formHelper}</p>
        </div>
        <div className="flex items-center text-sm">
          {saveState === 'saving' ? (
            <span className="text-neutral-500 flex items-center gap-1">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </span>
          ) : (
            <span className="text-green-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Saved locally
            </span>
          )}
        </div>
      </div>
      <div className="lg:grid lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div>
          <ResumeForm data={resumeData} onChange={setResumeData} />

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => alert(COPY.BUILDER.successMessage)}
            >
              Generate AI Summary
            </Button>
            <Button
              variant="secondary"
              onClick={() => alert('TODO: Integrate AI for bullet point improvement')}
            >
              {COPY.BUTTONS.RESUME.improve}
            </Button>
            <Button
              variant="secondary"
              onClick={() => alert('TODO: Integrate PDF generation')}
            >
              {COPY.BUTTONS.RESUME.download}
            </Button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="mt-6 lg:mt-0 lg:sticky lg:top-6 lg:self-start">
          <ResumePreview data={resumeData} />
        </div>
      </div>
    </div>
  );
};

export default BuilderPage;
