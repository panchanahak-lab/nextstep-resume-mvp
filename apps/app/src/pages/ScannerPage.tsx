import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, X, AlertCircle, CheckCircle2, Loader2, Info, Clock, Printer } from 'lucide-react';
import Card from '../../../../packages/shared/src/components/Card';
import Button from '../../../../packages/shared/src/components/Button';
import Badge from '../../../../packages/shared/src/components/Badge';
import Textarea from '../../../../packages/shared/src/components/Textarea';
import ScoreGauge from '../components/ScoreGauge';
import { COPY, getSupabaseClient } from '@nextstep/shared';
import { extractTextFromFile, type ParseResult } from '../utils/documentParser';
import { analyzeResume, type ATSScanResult, type ResumeIssue } from '../services/aiScanner';

interface ScanHistoryItem {
  id: string;
  created_at: string;
  score: number;
  mode: string;
}

interface SuggestedChange {
  original: string;
  replacement: string;
  suggestion: string;
}

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const extractQuotedReplacement = (suggestion = '') => {
  const patterns = [
    /replace\s+["'“”](.+?)["'“”]\s+with\s+["'“”](.+?)["'“”]/i,
    /replace\s+(.+?)\s+with\s+["'“”](.+?)["'“”]/i,
    /(?:correct|change|update)\s+["'“”](.+?)["'“”]\s+(?:to|as)\s+["'“”](.+?)["'“”]/i,
  ];

  for (const pattern of patterns) {
    const match = suggestion.match(pattern);
    if (match?.[1] && match?.[2]) {
      return {
        original: match[1].trim(),
        replacement: match[2].trim(),
      };
    }
  }

  return null;
};

const buildSuggestedChanges = (issues: ResumeIssue[]) => {
  return issues
    .map((issue) => {
      const replacement = extractQuotedReplacement(issue.suggestion);
      if (!replacement) return null;

      return {
        original: issue.highlight || replacement.original,
        replacement: replacement.replacement,
        suggestion: issue.suggestion || issue.title || '',
      };
    })
    .filter((change): change is SuggestedChange => Boolean(change?.original && change?.replacement));
};

const applySuggestedChanges = (resume: string, changes: SuggestedChange[]) => {
  return changes.reduce((draft, change) => {
    if (!change.original || !draft.includes(change.original)) return draft;
    return draft.replace(change.original, change.replacement);
  }, resume);
};

type DiffPart = { text: string; type: 'normal' | 'removed' | 'added' };

/**
 * Build an inline "tracked changes" view of the resume: each suggested edit keeps
 * the original snippet (rendered in yellow) immediately followed by the suggested
 * replacement (rendered in green) so the user can compare them in context.
 */
const buildDiffParts = (resume: string, changes: SuggestedChange[]): DiffPart[] => {
  const matches = changes
    .map((change) => {
      if (!change.original || !change.replacement) return null;
      const index = resume.indexOf(change.original);
      return index >= 0
        ? { index, original: change.original, replacement: change.replacement }
        : null;
    })
    .filter((match): match is { index: number; original: string; replacement: string } => Boolean(match))
    .sort((a, b) => a.index - b.index);

  const parts: DiffPart[] = [];
  let cursor = 0;

  matches.forEach((match) => {
    if (match.index < cursor) return;
    if (match.index > cursor) {
      parts.push({ text: resume.slice(cursor, match.index), type: 'normal' });
    }
    parts.push({ text: match.original, type: 'removed' });
    parts.push({ text: match.replacement, type: 'added' });
    cursor = match.index + match.original.length;
  });

  if (cursor < resume.length) {
    parts.push({ text: resume.slice(cursor), type: 'normal' });
  }

  return parts.length > 0 ? parts : [{ text: resume, type: 'normal' }];
};

const RESUME_SECTION_HEADINGS = [
  'CAREER OBJECTIVE', 'PROFESSIONAL SUMMARY', 'SUMMARY', 'PROFESSIONAL EXPERIENCE', 'WORK EXPERIENCE',
  'EXPERIENCE', 'EDUCATIONAL QUALIFICATION', 'EDUCATION', 'TECHNICAL SKILLS', 'SKILLS AND STRENGTHS',
  'KEY SKILLS', 'CORE COMPETENCIES', 'SKILLS', 'PROJECTS', 'CERTIFICATIONS', 'ACHIEVEMENTS',
  'AWARDS', 'HOBBIES', 'INTERESTS', 'LANGUAGES', 'PERSONAL DETAILS', 'DECLARATION', 'REFERENCES',
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Bold known CV section headings so the printed/downloaded resume looks structured. */
const applyHeadingStyling = (html: string) => {
  const sorted = [...RESUME_SECTION_HEADINGS].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${sorted.map((heading) => escapeRegExp(escapeHtml(heading))).join('|')})`, 'g');
  return html.replace(pattern, '<span class="cv-heading">$1</span>');
};

const diffPartsToHtml = (parts: DiffPart[]) => {
  const body = parts
    .map((part) => {
      const safe = escapeHtml(part.text).replace(/\n/g, '<br />');
      if (part.type === 'removed') return `<span class="cv-removed">${safe}</span>`;
      if (part.type === 'added') return `<span class="cv-added">${safe}</span>`;
      return safe;
    })
    .join('');
  return applyHeadingStyling(body);
};

const resumeTextToHtml = (resume: string) =>
  applyHeadingStyling(escapeHtml(resume).replace(/\n/g, '<br />'));

const ScannerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [showResults, setShowResults] = useState(false);

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL Fetcher State
  const [jobUrl, setJobUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [urlSuccess, setUrlSuccess] = useState('');

  // AI Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [parseWarning, setParseWarning] = useState('');
  const [scanResult, setScanResult] = useState<ATSScanResult | null>(null);
  const [scannedResumeText, setScannedResumeText] = useState('');

  // History State
  const [historyItems, setHistoryItems] = useState<ScanHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('scans')
        .select('id, created_at, score, mode')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setHistoryItems(data as ScanHistoryItem[]);
      }
    } catch (e) {
      console.error('Error fetching scan history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveScanToHistory = async (result: ATSScanResult, text: string) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('scans').insert({
        user_id: user.id,
        score: result.score,
        mode: result.mode,
        resume_snippet: text.substring(0, 100),
        missing_keywords: result.missingKeywords,
        strengths: result.strengths,
        suggestions: result.suggestions
      });
    } catch (e) {
      console.error('Failed to save scan history', e);
    }
  };

  const openRevisedResumePreview = (
    originalResume: string,
    changes: SuggestedChange[],
    improvedSummary?: string,
    keywords: string[] = [],
  ) => {
    const diffParts = buildDiffParts(originalResume, changes);
    const reviewBodyHtml = diffPartsToHtml(diffParts);

    // The downloaded/printed final copy has every suggestion applied (no yellow markers).
    const finalResume = applySuggestedChanges(originalResume, changes);
    const finalBodyHtml = resumeTextToHtml(finalResume);

    const summaryBlock = improvedSummary
      ? `<section class="cv-block cv-summary">
          <h2>AI-Optimized Professional Summary</h2>
          <p>${escapeHtml(improvedSummary)}</p>
        </section>`
      : '';

    const keywordsBlock = keywords.length > 0
      ? `<section class="cv-block cv-keywords">
          <h2>Suggested Keywords to Include</h2>
          <div class="chips">${keywords.map((keyword) => `<span class="chip">${escapeHtml(keyword)}</span>`).join('')}</div>
        </section>`
      : '';

    const sharedStyles = `
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #eef2f7;
        color: #1f2937;
        font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
        line-height: 1.5;
      }
      .sheet {
        width: min(8.5in, calc(100vw - 32px));
        margin: 24px auto;
        background: #ffffff;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
        padding: 0.75in;
        font-size: 13px;
      }
      .cv-body { white-space: pre-wrap; word-wrap: break-word; }
      .cv-heading {
        display: inline-block;
        margin-top: 14px;
        font-weight: 700;
        font-size: 13.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #1d4ed8;
        border-bottom: 1px solid #c7d2fe;
        padding-bottom: 2px;
      }
      .cv-block { margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px dashed #e2e8f0; }
      .cv-block h2 {
        margin: 0 0 8px;
        font-size: 13.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #1d4ed8;
      }
      .cv-summary p { margin: 0; }
      .chips { display: flex; flex-wrap: wrap; gap: 8px; }
      .chip {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
        border-radius: 999px;
        padding: 4px 12px;
        font-size: 12px;
        font-weight: 600;
      }
    `;

    // Standalone Word-openable document the user can keep on disk (clean, finalized resume).
    const downloadDoc = `<!doctype html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40" lang="en">
        <head>
          <meta charset="utf-8" />
          <title>NextStep Revised Resume</title>
          <style>${sharedStyles}
            body { background: #ffffff; }
            .sheet { box-shadow: none; margin: 0 auto; width: auto; padding: 0; }
            @page { size: A4; margin: 14mm; }
          </style>
        </head>
        <body>
          <main class="sheet">
            ${summaryBlock}
            <div class="cv-body">${finalBodyHtml}</div>
            ${keywordsBlock}
          </main>
        </body>
      </html>`;

    const previewHtml = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>NextStep Revised Resume</title>
          <style>
            ${sharedStyles}
            .toolbar {
              position: sticky;
              top: 0;
              z-index: 2;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              padding: 14px 24px;
              background: #ffffff;
              border-bottom: 1px solid #dbe3ef;
              flex-wrap: wrap;
            }
            .toolbar h1 { margin: 0; font-size: 18px; }
            .toolbar p { margin: 3px 0 0; color: #526174; font-size: 13px; }
            .toolbar .actions { display: flex; gap: 10px; }
            .btn {
              border: 0;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 700;
              padding: 10px 16px;
              font-size: 13px;
            }
            .btn-primary { background: #2563eb; color: #ffffff; }
            .btn-secondary { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
            .legend {
              display: flex;
              gap: 18px;
              flex-wrap: wrap;
              align-items: center;
              max-width: min(8.5in, calc(100vw - 32px));
              margin: 18px auto -6px;
              font-size: 12px;
              color: #475569;
            }
            .legend span { display: inline-flex; align-items: center; gap: 6px; }
            .swatch { width: 14px; height: 14px; border-radius: 3px; display: inline-block; }
            .swatch-current { background: #fef08a; border: 1px solid #fde047; }
            .swatch-suggested { background: #bbf7d0; border: 1px solid #86efac; }
            .cv-removed {
              background: #fef08a;
              color: #854d0e;
              text-decoration: line-through;
              padding: 0 2px;
              border-radius: 3px;
            }
            .cv-added {
              background: #bbf7d0;
              color: #166534;
              padding: 0 2px;
              border-radius: 3px;
            }
            @page { size: A4; margin: 14mm; }
            @media print {
              body { background: #ffffff; }
              .toolbar, .legend { display: none; }
              .sheet { width: auto; margin: 0; padding: 0; box-shadow: none; }
              .cv-removed { display: none; }
              .cv-added { background: transparent; color: inherit; }
            }
          </style>
        </head>
        <body>
          <header class="toolbar">
            <div>
              <h1>Revised Resume Draft</h1>
              <p>Yellow = current text, Green = AI-suggested text. Review, then download or print.</p>
            </div>
            <div class="actions">
              <button class="btn btn-secondary" type="button" onclick="downloadResume()">Download CV</button>
              <button class="btn btn-primary" type="button" onclick="window.print()">Print / Save as PDF</button>
            </div>
          </header>
          <div class="legend">
            <span><span class="swatch swatch-current"></span> Current text</span>
            <span><span class="swatch swatch-suggested"></span> Suggested text</span>
          </div>
          <main class="sheet">
            ${summaryBlock}
            <div class="cv-body">${reviewBodyHtml}</div>
            ${keywordsBlock}
          </main>
          <script>
            var DOWNLOAD_HTML = ${JSON.stringify(downloadDoc)};
            function downloadResume() {
              var blob = new Blob(['\ufeff', DOWNLOAD_HTML], { type: 'application/msword' });
              var url = URL.createObjectURL(blob);
              var link = document.createElement('a');
              link.href = url;
              link.download = 'NextStep-Revised-Resume.doc';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
            }
          </script>
        </body>
      </html>
    `;

    const previewUrl = URL.createObjectURL(new Blob([previewHtml], { type: 'text/html' }));
    const previewWindow = window.open(previewUrl, '_blank', 'width=900,height=1100');

    if (!previewWindow) {
      URL.revokeObjectURL(previewUrl);
      window.alert('Please allow pop-ups to preview and print the revised draft.');
      return;
    }

    window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60000);
  };

  const handleScan = async () => {
    setScanError('');
    setParseWarning('');
    setShowResults(false);

    if (!file && !resumeText.trim()) {
      setScanError('Please add your resume to continue');
      return;
    }

    setIsScanning(true);
    try {
      let finalResumeText = resumeText;
      const shouldAnalyzeUploadedFile = Boolean(file && !resumeText.trim() && file.name.toLowerCase().endsWith('.pdf'));

      if (file && !resumeText.trim()) {
        const parseResult: ParseResult = await extractTextFromFile(file);

        if (parseResult.warning && !parseResult.text) {
          if (file.name.toLowerCase().endsWith('.pdf')) {
            setParseWarning('We could not preview the resume text, but we will scan the uploaded PDF directly.');
            finalResumeText = file.name;
          } else {
            setParseWarning(parseResult.warning);
            setIsScanning(false);
            return;
          }
        }

        if (parseResult.warning && parseResult.text) {
          setParseWarning(parseResult.warning);
        }

        if (parseResult.text) {
          finalResumeText = parseResult.text;
        }
      }

      if (!finalResumeText.trim() && !shouldAnalyzeUploadedFile) {
        setScanError('Please add your resume to continue');
        setIsScanning(false);
        return;
      }

      const result = await analyzeResume({
        resumeText: finalResumeText,
        resumeFile: shouldAnalyzeUploadedFile ? file : null,
        jobDescription,
      });
      setScanResult(result);
      setScannedResumeText(finalResumeText.trim() && finalResumeText !== file?.name ? finalResumeText : '');
      setShowResults(true);
      
      // Save to Supabase
      await saveScanToHistory(result, finalResumeText.trim() || file?.name || 'Uploaded resume');
    } catch (error: any) {
      setScanError(error.message || 'An error occurred during scanning. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileProcess = (selectedFile: File) => {
    setFileError('');
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && !selectedFile.name.toLowerCase().endsWith('.docx')) {
      setFileError('Please upload a PDF or DOCX file only.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds 5MB. Please upload a smaller file.');
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleFetchJob = () => {
    setUrlError('');
    setUrlSuccess('');
    
    if (!jobUrl || !jobUrl.startsWith('http')) {
      setUrlError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    if (jobUrl.toLowerCase().includes('linkedin.com')) {
      setUrlError('LinkedIn blocks automated access. Please copy-paste manually.');
      return;
    }

    setIsFetching(true);
    setTimeout(() => {
      setIsFetching(false);
      setJobDescription('This is a simulated fetched job description. We are looking for a skilled candidate with experience in React, TypeScript, and Tailwind CSS. You will be responsible for building responsive UI components and integrating with backend APIs.');
      setUrlSuccess('Job details fetched successfully');
    }, 1500);
  };

  const suggestedChanges = scanResult ? buildSuggestedChanges(scanResult.issues) : [];
  const canPreviewRevisedResume = Boolean(scannedResumeText && suggestedChanges.length > 0);
  const diffParts = canPreviewRevisedResume
    ? buildDiffParts(scannedResumeText, suggestedChanges)
    : [];

  return (
    <div>
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-6">
        <button
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'scan'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
          onClick={() => setActiveTab('scan')}
        >
          New Scan
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
          onClick={() => setActiveTab('history')}
        >
          <Clock className="w-4 h-4" /> History
        </button>
      </div>

      {activeTab === 'history' ? (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Your Past Scans</h2>
          {loadingHistory ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
          ) : historyItems.length > 0 ? (
            <div className="space-y-4">
              {historyItems.map((item) => (
                <Card key={item.id} className="p-4 flex items-center justify-between">
                  <div>
                    <Badge>{item.mode === 'ats-match' ? 'ATS Match' : 'Quality Check'}</Badge>
                    <p className="text-sm text-neutral-500 mt-2">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{item.score}<span className="text-sm text-neutral-500 font-normal">/100</span></p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-neutral-500">
              No previous scans found.
            </Card>
          )}
        </div>
      ) : (
        <div>
          {/* Input Section */}
          <div className="lg:grid lg:grid-cols-2 gap-8">
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{COPY.UPLOAD.headline}</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">{COPY.UPLOAD.supportText}</p>
          </div>

          {/* File Upload Dropzone */}
          <div 
            className={`mb-6 border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-neutral-300 dark:border-neutral-700 hover:border-primary-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">{file.name}</p>
                <p className="text-xs text-green-600 font-medium mb-4 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Uploaded successfully
                </p>
                <button 
                  onClick={() => setFile(null)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-base font-bold text-neutral-900 dark:text-white mb-1">Upload your resume</p>
                <p className="text-sm text-neutral-500 mb-4">Supports PDF and DOCX files up to 5MB</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".pdf,.docx" 
                  onChange={handleFileChange} 
                />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
                {fileError && (
                  <p className="mt-3 text-sm text-red-600 flex items-center gap-1 justify-center">
                    <AlertCircle className="w-4 h-4" /> {fileError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-700"></div>
            <span className="flex-shrink-0 mx-4 text-neutral-400 text-sm font-medium">or paste your resume text below</span>
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-700"></div>
          </div>

          <Textarea
            label="Your Resume Text"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={8}
            placeholder="Paste your resume text here..."
          />
        </div>

        <div className="mt-8 lg:mt-0">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{COPY.JOB_MATCH.headline}</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">{COPY.JOB_MATCH.supportText}</p>
          </div>

          {/* Job URL Fetcher */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Paste job link</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => {
                  setJobUrl(e.target.value);
                  setUrlError('');
                  setUrlSuccess('');
                }}
                placeholder="Paste job URL from Naukri, LinkedIn, Indeed..."
                className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button variant="secondary" onClick={handleFetchJob} disabled={isFetching}>
                {isFetching ? 'Fetching...' : 'Fetch Job Details'}
              </Button>
            </div>
            {urlError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {urlError}
              </p>
            )}
            {urlSuccess && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {urlSuccess}
              </p>
            )}
          </div>

          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-700"></div>
            <span className="flex-shrink-0 mx-4 text-neutral-400 text-sm font-medium">or paste the job description below</span>
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-700"></div>
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

      <div className="mt-10 mb-4 border-t border-neutral-200 dark:border-neutral-800 pt-8">
        {/* Soft suggestion when no JD */}
        {!jobDescription.trim() && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg max-w-2xl">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 Add a job description to get a personalised match score and missing keywords.
            </p>
          </div>
        )}

        {/* Parse warning (soft, not blocking) */}
        {parseWarning && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg max-w-2xl">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300">{parseWarning}</p>
          </div>
        )}

        <Button variant="primary" className="w-full sm:w-auto px-8 py-3 text-lg font-bold flex items-center justify-center gap-2" onClick={handleScan} disabled={isScanning}>
          {isScanning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Scanning...
            </>
          ) : (
            'Scan My Resume'
          )}
        </Button>
        {scanError && (
          <p className="mt-3 text-sm text-red-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-4 h-4" /> {scanError}
          </p>
        )}
        <p className="mt-3 text-sm text-neutral-500 max-w-2xl">
          We will compare your resume against the job description and show your readiness score, matched keywords, missing keywords, and what to fix before you apply.
        </p>
      </div>

      {/* Results Section */}
      {showResults && scanResult && (
        <div className="mt-8">
          {/* Score */}
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <ScoreGauge
                score={scanResult.score}
                label={scanResult.mode === 'ats-match' ? 'ATS Compatibility Score' : 'Resume Quality Score'}
              />
              <p className="mt-4 text-neutral-900 dark:text-white font-medium">
                {scanResult.mode === 'ats-match'
                  ? `You are ${scanResult.score}/100 ready for this job`
                  : `Your resume quality is ${scanResult.score}/100`}
              </p>
              <p className="text-neutral-500 mt-1">
                {scanResult.score >= 80 ? COPY.ATS.highScore : scanResult.score >= 50 ? COPY.ATS.midScore : COPY.ATS.lowScore}
              </p>
              <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-neutral-200 bg-white text-left shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <div className="border-r border-neutral-200 px-4 py-3 dark:border-neutral-700">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Current</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">{scanResult.score}/100</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-green-600 dark:text-green-400">After changes</p>
                  <p className="mt-1 text-lg font-semibold text-green-700 dark:text-green-300">{scanResult.projectedScore}/100</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                Estimated score after applying the suggested keywords and CV changes.
              </p>
            </div>
          </div>

          {/* Details */}
          <div className={`grid grid-cols-1 gap-6 ${scanResult.mode === 'ats-match' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            {/* Strengths */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Strengths
              </h3>
              {scanResult.strengths.length > 0 ? (
                <ul className="space-y-2">
                  {scanResult.strengths.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 flex-shrink-0 mt-0.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  No clear strengths were found in this scan.
                </p>
              )}
            </Card>

            {/* Missing Keywords — only shown in ATS match mode */}
            {scanResult.mode === 'ats-match' && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {scanResult.missingKeywords.length > 0 ? (
                    scanResult.missingKeywords.map((keyword, index) => (
                      <Badge key={index}>{keyword}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">No critical missing keywords found.</p>
                  )}
                </div>
              </Card>
            )}

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
                {scanResult.suggestions.length > 0 ? (
                  scanResult.suggestions.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                      <span className="text-yellow-500 flex-shrink-0">•</span>
                      {item}
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500">
                    {scanResult.mode === 'ats-match'
                      ? 'Your resume perfectly matches the job description!'
                      : 'Your resume looks great — no major improvements needed!'}
                  </p>
                )}
              </ul>
            </Card>
          </div>

          {(scanResult.issues.length > 0 || suggestedChanges.length > 0) && (
            <Card className="mt-6 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-1">
                    Suggested CV Changes
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Review the exact text the AI found, then use the revised draft below to print a highlighted copy.
                  </p>
                </div>
                {canPreviewRevisedResume && (
                  <Button
                    variant="secondary"
                    onClick={() => openRevisedResumePreview(
                      scannedResumeText,
                      suggestedChanges,
                      scanResult.improvedSummary,
                      scanResult.missingKeywords,
                    )}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Preview & print revised draft
                  </Button>
                )}
              </div>

              {scanResult.improvedSummary && (
                <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">Suggested professional summary</p>
                  <p className="mt-2 text-sm text-green-900 dark:text-green-200">{scanResult.improvedSummary}</p>
                </div>
              )}

              {scanResult.issues.length > 0 && (
                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {scanResult.issues.map((issue, index) => (
                    <div key={`${issue.title || 'issue'}-${index}`} className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {issue.title || `Issue #${index + 1}`}
                          </p>
                          {issue.location && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{issue.location}</p>
                          )}
                        </div>
                        {issue.severity && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold capitalize text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            {issue.severity}
                          </span>
                        )}
                      </div>
                      {issue.highlight && (
                        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
                          <span className="font-semibold">Current text: </span>
                          <mark className="bg-red-100 text-red-900 dark:bg-red-900/50 dark:text-red-100">{issue.highlight}</mark>
                        </div>
                      )}
                      {issue.suggestion && (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950/30 dark:text-green-200">
                          <span className="font-semibold">Suggested change: </span>
                          {issue.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {canPreviewRevisedResume && (
                <div className="mt-6">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Your CV with tracked changes</h4>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-sm border border-yellow-300 bg-yellow-200" />
                        Current text
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-sm border border-green-300 bg-green-200" />
                        Suggested text
                      </span>
                    </div>
                  </div>
                  <div className="max-h-[520px] overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                      {diffParts.map((part, index) => {
                        if (part.type === 'removed') {
                          return (
                            <mark
                              key={`removed-${index}`}
                              className="rounded bg-yellow-200 px-1 text-yellow-900 line-through decoration-yellow-700/60 dark:bg-yellow-500/30 dark:text-yellow-100"
                            >
                              {part.text}
                            </mark>
                          );
                        }
                        if (part.type === 'added') {
                          return (
                            <mark
                              key={`added-${index}`}
                              className="rounded bg-green-200 px-1 text-green-900 dark:bg-green-500/30 dark:text-green-100"
                            >
                              {part.text}
                            </mark>
                          );
                        }
                        return <React.Fragment key={`normal-${index}`}>{part.text}</React.Fragment>;
                      })}
                    </pre>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Yellow shows your current wording and green shows the AI-suggested replacement. Open the full draft to download or print.
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
      </div>
      )}
    </div>
  );
};

export default ScannerPage;
