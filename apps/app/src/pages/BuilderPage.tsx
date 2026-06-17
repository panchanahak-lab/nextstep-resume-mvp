import React, { useState } from 'react';
import type { ResumeData } from '../../../../packages/shared/src/types';
import Button from '../../../../packages/shared/src/components/Button';
import ResumeForm from '../components/ResumeForm';
import ResumePreview from '../components/ResumePreview';
import { mockResumeData } from '../data/mockData';

const BuilderPage: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(mockResumeData);

  return (
    <div>
      <div className="lg:grid lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div>
          <ResumeForm data={resumeData} onChange={setResumeData} />

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => alert('TODO: Integrate Gemini API for summary generation')}
            >
              Generate AI Summary
            </Button>
            <Button
              variant="secondary"
              onClick={() => alert('TODO: Integrate AI for bullet point improvement')}
            >
              Improve Bullet Points
            </Button>
            <Button
              variant="secondary"
              onClick={() => alert('TODO: Integrate PDF generation')}
            >
              Download PDF
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
