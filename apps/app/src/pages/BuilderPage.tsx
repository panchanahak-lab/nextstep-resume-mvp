import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Check, ChevronDown, Download, FileText, Loader2, Printer, X } from 'lucide-react';
import type { ResumeData } from '../../../../packages/shared/src/types';
import { COPY, getSupabaseClient } from '@nextstep/shared';
import Button from '../../../../packages/shared/src/components/Button';
import ResumeForm from '../components/ResumeForm';
import ResumePreview from '../components/ResumePreview';
import { createResumePdfBlob, downloadPdfUrl, getResumePdfFilename } from '../utils/resumePdf';
import { emptyResumeData, loadStoredResume, saveStoredResume } from '../utils/resumeStorage';

const BuilderPage: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(emptyResumeData);

  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const [resumeOwnerId, setResumeOwnerId] = useState<string | null>(null);
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ filename: string } | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [improveStatus, setImproveStatus] = useState('');
  const [improveError, setImproveError] = useState('');

  useEffect(() => {
    const loadResume = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

        if (!user) {
          setResumeOwnerId(null);
          setResumeData(emptyResumeData);
          return;
        }

        setResumeOwnerId(user.id);
        setResumeData(loadStoredResume(user.id) ?? emptyResumeData);
      } finally {
        setResumeLoaded(true);
      }
    };

    loadResume();
  }, []);

  // Debounced save to localStorage
  useEffect(() => {
    if (!resumeLoaded || !resumeOwnerId) return;

    setSaveState('saving');
    const timer = setTimeout(() => {
      saveStoredResume(resumeOwnerId, resumeData);
      setSaveState('saved');
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [resumeData, resumeLoaded, resumeOwnerId]);

  const handlePreviewPdf = useCallback(() => {
    if (resumeOwnerId) {
      saveStoredResume(resumeOwnerId, resumeData);
    }
    setSaveState('saved');
    setPdfPreview({ filename: getResumePdfFilename(resumeData) });
  }, [resumeData, resumeOwnerId]);

  const handleClosePreview = useCallback(() => {
    setPdfPreview(null);
  }, []);

  const handleDownloadPreview = useCallback(() => {
    if (!pdfPreview) return;
    const blob = createResumePdfBlob(resumeData);
    const url = URL.createObjectURL(blob);
    downloadPdfUrl(url, pdfPreview.filename);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [pdfPreview, resumeData]);

  const improveBulletText = useCallback(async (text: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('AI improvement needs Supabase configuration.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Please log in with Google before improving your resume.');
    }

    const { data, error } = await supabase.functions.invoke('resume-enhancement', {
      body: { text },
    });

    if (error) {
      throw new Error(error.message || 'AI improvement failed. Please try again.');
    }

    const improvedText = (data as { result?: { text?: string } } | null)?.result?.text;
    if (!improvedText?.trim()) {
      throw new Error('AI could not return an improved version. Please try again.');
    }

    return improvedText.trim();
  }, []);

  const handleImproveResume = useCallback(async () => {
    setImproveError('');
    setImproveStatus('');

    const improvementCount = resumeData.experience.filter((item) => item.description.trim()).length
      + resumeData.projects.filter((item) => item.description.trim()).length;

    if (improvementCount === 0) {
      setImproveError('Add at least one experience or project description before improving your resume.');
      return;
    }

    setIsImproving(true);
    try {
      let completed = 0;
      const improveWithProgress = async (text: string) => {
        const improvedText = await improveBulletText(text);
        completed += 1;
        setImproveStatus(`Improved ${completed} of ${improvementCount} resume points.`);
        return improvedText;
      };

      const improvedExperience = await Promise.all(
        resumeData.experience.map(async (item) => {
          if (!item.description.trim()) return item;
          return {
            ...item,
            description: await improveWithProgress(item.description),
          };
        }),
      );

      const improvedProjects = await Promise.all(
        resumeData.projects.map(async (item) => {
          if (!item.description.trim()) return item;
          return {
            ...item,
            description: await improveWithProgress(item.description),
          };
        }),
      );

      setResumeData({
        ...resumeData,
        experience: improvedExperience,
        projects: improvedProjects,
      });
      setImproveStatus('Resume points improved. Review the wording before downloading.');
    } catch (error) {
      setImproveError(error instanceof Error ? error.message : 'AI improvement failed. Please try again.');
      setImproveStatus('');
    } finally {
      setIsImproving(false);
    }
  }, [improveBulletText, resumeData]);

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
              onClick={handleImproveResume}
              disabled={isImproving}
            >
              <span className="inline-flex items-center gap-2">
                {isImproving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isImproving ? 'Improving...' : COPY.BUTTONS.RESUME.improve}
              </span>
            </Button>
            <Button
              variant="secondary"
              onClick={handlePreviewPdf}
            >
              <span className="inline-flex items-center gap-2">
                <Printer className="h-4 w-4" />
                {COPY.BUTTONS.RESUME.download}
              </span>
            </Button>
          </div>
          {(improveStatus || improveError) && (
            <div
              className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                improveError
                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
                  : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300'
              }`}
            >
              {improveError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{improveError || improveStatus}</span>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="mt-6 lg:mt-0 lg:sticky lg:top-6 lg:self-start">
          <ResumePreview data={resumeData} />
        </div>
      </div>

      {pdfPreview && (
        <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-sm">
          <div className="flex h-full w-full flex-col bg-neutral-100 text-neutral-950 shadow-2xl dark:bg-neutral-950">
            <div className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-neutral-950 dark:text-white">Preview resume PDF</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{pdfPreview.filename}</p>
                </div>
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

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-h-0 overflow-auto bg-neutral-300 px-4 py-6 dark:bg-neutral-800 md:px-8">
                <div className="mx-auto w-full max-w-[820px]">
                  <div className="mx-auto min-h-[1060px] w-full bg-white p-6 shadow-2xl ring-1 ring-neutral-400/40 sm:p-8 lg:p-10">
                    <ResumePreview
                      data={resumeData}
                      paperMode
                      className="min-h-[980px] border-0 p-0 lg:p-0"
                    />
                  </div>
                </div>
              </div>

              <aside className="flex min-h-0 flex-col border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:border-l lg:border-t-0">
                <div className="flex-1 overflow-auto p-6">
                  <div className="mb-8 flex items-center justify-between gap-4">
                    <h3 className="text-2xl font-semibold text-neutral-950 dark:text-white">Print</h3>
                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Clean PDF</span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Destination</label>
                      <div className="flex h-12 items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white">
                        <span className="flex items-center gap-2">
                          <Printer className="h-5 w-5 text-neutral-500" />
                          Save as PDF
                        </span>
                        <ChevronDown className="h-4 w-4 text-neutral-500" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Pages</label>
                      <div className="flex h-12 items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white">
                        <span>Auto-fit resume content</span>
                        <ChevronDown className="h-4 w-4 text-neutral-500" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Color</label>
                      <div className="flex h-12 items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white">
                        <span>Color</span>
                        <ChevronDown className="h-4 w-4 text-neutral-500" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-8 flex w-full items-center justify-between border-t border-neutral-200 py-5 text-left text-lg font-medium text-neutral-900 dark:border-neutral-800 dark:text-white"
                  >
                    More settings
                    <ChevronDown className="h-5 w-5 text-neutral-500" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 p-5 dark:border-neutral-800">
                  <Button variant="secondary" onClick={handleClosePreview}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleDownloadPreview}>
                    <span className="inline-flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download PDF
                    </span>
                  </Button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuilderPage;
