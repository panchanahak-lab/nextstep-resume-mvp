import React, { useState, useEffect, useCallback } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import type { ResumeData } from '../../../../packages/shared/src/types';
import { COPY } from '@nextstep/shared';
import Button from '../../../../packages/shared/src/components/Button';
import ResumeForm from '../components/ResumeForm';
import ResumePreview from '../components/ResumePreview';
import { mockResumeData } from '../data/mockData';
import { createResumePdfBlob, downloadPdfUrl, getResumePdfFilename } from '../utils/resumePdf';

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
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);

  // Debounced save to localStorage
  useEffect(() => {
    setSaveState('saving');
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));
      setSaveState('saved');
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [resumeData]);

  useEffect(() => {
    return () => {
      if (pdfPreview?.url) URL.revokeObjectURL(pdfPreview.url);
    };
  }, [pdfPreview?.url]);

  const handlePreviewPdf = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));
    setSaveState('saved');
    const blob = createResumePdfBlob(resumeData);
    const url = URL.createObjectURL(blob);

    setPdfPreview((currentPreview) => {
      if (currentPreview?.url) URL.revokeObjectURL(currentPreview.url);
      return {
        url,
        filename: getResumePdfFilename(resumeData),
      };
    });
  }, [resumeData]);

  const handleClosePreview = useCallback(() => {
    setPdfPreview((currentPreview) => {
      if (currentPreview?.url) URL.revokeObjectURL(currentPreview.url);
      return null;
    });
  }, []);

  const handleDownloadPreview = useCallback(() => {
    if (!pdfPreview) return;
    downloadPdfUrl(pdfPreview.url, pdfPreview.filename);
  }, [pdfPreview]);

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
              onClick={handlePreviewPdf}
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

      {pdfPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-sm">
          <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
            <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-5 py-4 dark:border-neutral-700">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">Preview resume PDF</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Review the clean PDF before downloading.</p>
              </div>
              <button
                type="button"
                onClick={handleClosePreview}
                className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                aria-label="Close PDF preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 bg-neutral-100 p-3 dark:bg-neutral-950">
              <iframe
                src={pdfPreview.url}
                title="Resume PDF preview"
                className="h-full w-full rounded-lg border border-neutral-200 bg-white dark:border-neutral-700"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 px-5 py-4 dark:border-neutral-700">
              <Button variant="secondary" onClick={handleClosePreview}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleDownloadPreview}>
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuilderPage;
