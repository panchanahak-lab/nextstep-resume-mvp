import React, { useState } from 'react';
import type { ResumeData } from '../../../../packages/shared/src/types';
import { COPY } from '@nextstep/shared';
import Button from '../../../../packages/shared/src/components/Button';
import ResumeForm from '../components/ResumeForm';
import ResumePreview from '../components/ResumePreview';
import { mockResumeData } from '../data/mockData';

const BuilderPage: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(mockResumeData);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{COPY.BUILDER.headline}</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">{COPY.BUILDER.supportText}</p>
        <p className="text-sm text-primary-600 font-medium mt-1">{COPY.BUILDER.formHelper}</p>
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
