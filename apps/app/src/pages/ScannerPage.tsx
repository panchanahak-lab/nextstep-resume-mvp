import React, { useState } from 'react';
import Card from '../../../../packages/shared/src/components/Card';
import Button from '../../../../packages/shared/src/components/Button';
import Badge from '../../../../packages/shared/src/components/Badge';
import Textarea from '../../../../packages/shared/src/components/Textarea';
import ScoreGauge from '../components/ScoreGauge';
import { mockScanResult } from '../data/mockData';
import { COPY } from '@nextstep/shared';

const ScannerPage: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleScan = () => {
    // TODO: Integrate with backend scanning API
    setShowResults(true);
  };

  return (
    <div>
      {/* Input Section */}
      <div className="lg:grid lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{COPY.UPLOAD.headline}</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">{COPY.UPLOAD.supportText}</p>
          </div>
          <Textarea
            label="Your Resume Text"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={8}
            placeholder="Paste your resume text here..."
            helperText={COPY.UPLOAD.instruction}
          />
        </div>
        <div className="mt-4 lg:mt-0">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{COPY.JOB_MATCH.headline}</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">{COPY.JOB_MATCH.supportText}</p>
          </div>
          <Textarea
            label="Job Description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={8}
            placeholder="Paste the job description here..."
          />
        </div>
      </div>

      <div className="mt-6">
        <Button variant="primary" className="w-full sm:w-auto" onClick={handleScan}>
          {COPY.JOB_MATCH.cta}
        </Button>
      </div>

      {/* Results Section */}
      {showResults && (
        <div className="mt-8">
          {/* Score */}
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <ScoreGauge score={mockScanResult.score} label="ATS Compatibility Score" />
              <p className="mt-4 text-neutral-900 font-medium">{COPY.JOB_MATCH.resultMessage(mockScanResult.score)}</p>
              <p className="text-neutral-500 mt-1">
                {mockScanResult.score >= 80 ? COPY.ATS.highScore : mockScanResult.score >= 50 ? COPY.ATS.midScore : COPY.ATS.lowScore}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strengths */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Strengths
              </h3>
              <ul className="space-y-2">
                {mockScanResult.strengths.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 flex-shrink-0 mt-0.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Missing Keywords */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {mockScanResult.missingKeywords.map((keyword, index) => (
                  <Badge key={index}>{keyword}</Badge>
                ))}
              </div>
            </Card>

            {/* Suggestions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="9" y1="18" x2="15" y2="18" />
                  <line x1="10" y1="22" x2="14" y2="22" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                </svg>
                Improvement Suggestions
              </h3>
              <ul className="space-y-2">
                {mockScanResult.suggestions.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <span className="text-yellow-500 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;
