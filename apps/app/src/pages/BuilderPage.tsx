import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Check, ChevronDown, Download, Eye, FileText, Loader2, Palette, Printer, X } from 'lucide-react';
import type { ResumeData } from '../../../../packages/shared/src/types';
import { COPY, getSupabaseClient } from '@nextstep/shared';
import Button from '../../../../packages/shared/src/components/Button';
import ResumeForm from '../components/ResumeForm';
import ResumePreview, { type ResumeTemplateId } from '../components/ResumePreview';
import { createResumePdfBlob, downloadPdfUrl, getResumePdfFilename } from '../utils/resumePdf';
import { emptyResumeData, loadStoredResume, saveStoredResume } from '../utils/resumeStorage';

const BUILDER_STEPS = [
  { id: 'basic-info', label: 'Basic Info' },
  { id: 'summary', label: 'Summary' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
];

const RESUME_TEMPLATES: Array<{
  id: ResumeTemplateId;
  name: string;
  access: 'free' | 'pro' | 'premium';
}> = [
  { id: 'classic-clean', name: 'Classic Clean', access: 'free' },
  { id: 'modern-blue', name: 'Modern Blue', access: 'pro' },
  { id: 'minimal-pro', name: 'Minimal Pro', access: 'pro' },
  { id: 'campus-fresher', name: 'Campus Fresher', access: 'pro' },
  { id: 'government-format', name: 'Government Format', access: 'premium' },
];

const BuilderStepIndicator: React.FC<{ steps: typeof BUILDER_STEPS; activeStep: string }> = ({ steps, activeStep }) => {
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStep));

  return (
    <div className="mb-5 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex min-w-[620px] items-start">
        {steps.map((step, index) => {
          const isActive = step.id === activeStep;
          const isCompleted = index < activeIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="group relative flex flex-1 flex-col items-center gap-2 text-center text-xs focus:outline-none"
            >
              {index < steps.length - 1 && (
                <span className="absolute left-1/2 top-1 h-px w-full bg-neutral-300 dark:bg-neutral-700" />
              )}
              <span
                className={`relative z-10 h-2 w-2 rounded-full ${
                  isActive ? 'bg-primary-600' : isCompleted ? 'bg-neutral-500' : 'bg-neutral-400 dark:bg-neutral-600'
                }`}
              />
              <span
                className={`pb-1 ${
                  isActive
                    ? 'border-b-2 border-primary-600 font-bold text-primary-600 dark:text-primary-400'
                    : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200'
                }`}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const BuilderPage: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(emptyResumeData);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateId>(() => {
    if (typeof window === 'undefined') return 'classic-clean';
    return (localStorage.getItem('nextstep_selected_template') as ResumeTemplateId | null) ?? 'classic-clean';
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [lockedTemplateId, setLockedTemplateId] = useState<ResumeTemplateId | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState('basic-info');

  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const [resumeOwnerId, setResumeOwnerId] = useState<string | null>(null);
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ filename: string } | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [improveStatus, setImproveStatus] = useState('');
  const [improveError, setImproveError] = useState('');
  const currentPlan: 'free' = 'free';

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry?.target.id) {
          setActiveStep(visibleEntry.target.id);
        }
      },
      { threshold: 0.3 },
    );

    BUILDER_STEPS.forEach((step) => {
      const section = document.getElementById(step.id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

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

  const handleSelectTemplate = useCallback((template: typeof RESUME_TEMPLATES[number]) => {
    const isLocked = template.access === 'premium' || (template.access === 'pro' && currentPlan === 'free');

    if (isLocked) {
      setLockedTemplateId(template.id);
      return;
    }

    setSelectedTemplate(template.id);
    localStorage.setItem('nextstep_selected_template', template.id);
    setShowTemplateModal(false);
    setLockedTemplateId(null);
  }, [currentPlan]);

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
      <BuilderStepIndicator steps={BUILDER_STEPS} activeStep={activeStep} />
      <div className="lg:grid lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div>
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-400 transition-colors hover:bg-blue-500/10"
          >
            <Palette className="h-4 w-4" />
            Choose Template
          </button>
          <ResumeForm
            data={resumeData}
            onChange={setResumeData}
            selectedTemplate={selectedTemplate}
            profilePhoto={profilePhoto}
            onProfilePhotoChange={setProfilePhoto}
          />

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
        <div className="hidden lg:mt-0 lg:block lg:sticky lg:top-6 lg:self-start">
          <ResumePreview data={resumeData} selectedTemplate={selectedTemplate} profilePhoto={profilePhoto} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowMobilePreview(true)}
        className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow-xl lg:hidden"
      >
        <Eye className="h-5 w-5" />
        Preview Resume
      </button>

      {showMobilePreview && (
        <div className="fixed inset-0 z-40 bg-black/70 lg:hidden">
          <div className="fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto rounded-t-2xl bg-neutral-950">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-5 py-4">
              <h2 className="text-lg font-bold text-white">Resume Preview</h2>
              <button
                type="button"
                onClick={() => setShowMobilePreview(false)}
                className="text-sm font-semibold text-gray-400"
              >
                Close
              </button>
            </div>
            <div className="p-4 pb-24">
              <ResumePreview data={resumeData} selectedTemplate={selectedTemplate} profilePhoto={profilePhoto} />
            </div>
            <div className="sticky bottom-0 border-t border-neutral-800 bg-neutral-950 p-4">
              <button
                type="button"
                onClick={handlePreviewPdf}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-sm">
          <div className="mx-auto mt-16 w-[min(960px,calc(100vw-24px))] rounded-2xl border border-neutral-700 bg-neutral-900 p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Choose Template</h2>
                <p className="text-sm text-neutral-400">Pick the resume style that fits the application.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                aria-label="Close template picker"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {RESUME_TEMPLATES.map((template) => {
                const isSelected = selectedTemplate === template.id;
                const isLocked = template.access === 'premium' || (template.access === 'pro' && currentPlan === 'free');
                const accent = template.id === 'campus-fresher' ? 'bg-green-600' : template.id === 'modern-blue' ? 'bg-blue-600' : 'bg-neutral-900';

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelectTemplate(template)}
                    className={`min-w-[180px] rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-neutral-700 bg-neutral-950 hover:border-blue-500/70'
                    }`}
                  >
                    <div className="relative h-28 rounded-lg bg-white p-3">
                      {(template.access === 'pro' || template.access === 'premium') && (
                        <span className="absolute right-2 top-2 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-white">
                          {template.access === 'premium' ? 'Premium' : 'Pro'}
                        </span>
                      )}
                      {template.id === 'modern-blue' && <div className="mb-3 h-8 rounded bg-blue-600" />}
                      {template.id === 'campus-fresher' && <div className="mb-3 h-1.5 rounded bg-green-600" />}
                      {template.id === 'minimal-pro' && <div className="mb-3 h-px bg-neutral-300" />}
                      {template.id === 'government-format' && <div className="mb-2 h-4 border border-neutral-900" />}
                      <div className={`mb-2 h-2 w-2/3 rounded ${accent}`} />
                      <div className="mb-1 h-1.5 w-full rounded bg-neutral-300" />
                      <div className="mb-1 h-1.5 w-5/6 rounded bg-neutral-300" />
                      <div className="mb-1 h-1.5 w-3/4 rounded bg-neutral-300" />
                    </div>
                    <p className="mt-3 font-semibold text-white">{template.name}</p>
                    {lockedTemplateId === template.id && (
                      <p className="mt-2 text-xs text-blue-300">
                        Upgrade to {template.access === 'premium' ? 'Premium' : 'Pro'} to unlock
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
                      selectedTemplate={selectedTemplate}
                      profilePhoto={profilePhoto}
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
