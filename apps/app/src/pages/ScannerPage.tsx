import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  X, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Info, 
  Clock, 
  Printer, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  Award, 
  ListChecks, 
  Copy,
  Target
} from 'lucide-react';
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
  final_score: number;
  job_role: string | null;
  confidence_level: 'High' | 'Medium' | 'Low';
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
  const [jobRole, setJobRole] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

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
        .from('ats_scans')
        .select('id, created_at, final_score, job_role, confidence_level')
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
        jobRole,
      });

      setScanResult(result);
      setScannedResumeText(finalResumeText.trim() && finalResumeText !== file?.name ? finalResumeText : '');
      setShowResults(true);
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

  const handleCopySummary = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Helper to format formatting issue IDs to readable strings
  const getFormattingIssueLabel = (issueId: string) => {
    switch (issueId) {
      case 'complex_tables_detected':
        return 'Complex tables detected (e.g. tables with merged cells or nested columns)';
      case 'image_heavy_or_unreadable':
        return 'Image-heavy or unreadable contents (ATS scanners cannot read image text)';
      case 'missing_clear_headings':
        return 'Missing clear section headings (limits structure detection)';
      case 'very_long_paragraphs':
        return 'Paragraphs are too long (bullets should be short and snappy)';
      case 'unusual_symbols_or_formatting_noise':
        return 'Unusual symbols or formatting noise (limits parser accuracy)';
      case 'poor_text_extraction_quality':
        return 'Poor text extraction quality (corrupt PDF content or characters)';
      default:
        return issueId;
    }
  };

  // Calculate deductions list
  const getDeductions = (result: ATSScanResult) => {
    const deductionsList: { name: string; deduction: number }[] = [];
    
    // 1. Keyword Score
    const kwDeduction = 30 - Number(result.keyword_score);
    if (kwDeduction > 0) {
      deductionsList.push({ name: 'Job description keywords gap', deduction: kwDeduction });
    }

    // 2. Skills Score
    const skDeduction = 20 - Number(result.skills_score);
    if (skDeduction > 0) {
      deductionsList.push({ name: 'Skills coverage gap', deduction: skDeduction });
    }

    // 3. Experience Score
    const expDeduction = 15 - Number(result.experience_score);
    if (expDeduction > 0) {
      deductionsList.push({ name: `Relevance gap (${result.experience_relevance?.label || 'not found'} relevance)`, deduction: expDeduction });
    }

    // 4. Structure Score
    const struct = result.resume_sections_found;
    if (struct) {
      if (!struct.contact) deductionsList.push({ name: 'Missing contact details section', deduction: 3 });
      if (!struct.summary) deductionsList.push({ name: 'Missing professional summary or objective', deduction: 2 });
      if (!struct.skills) deductionsList.push({ name: 'Missing skills section', deduction: 3 });
      if (!struct.experience && !struct.projects) deductionsList.push({ name: 'Missing experience or projects section', deduction: 3 });
      if (!struct.education) deductionsList.push({ name: 'Missing education section', deduction: 2 });
      if (!struct.certifications) deductionsList.push({ name: 'Missing certifications or extra sections', deduction: 2 });
    }

    // 5. Formatting Score
    const formattingIssues = result.formatting_issues || [];
    const hasIssue = (key: string) => formattingIssues.includes(key) || formattingIssues.some((i: string) => i.toLowerCase().includes(key));
    if (hasIssue('table')) deductionsList.push({ name: 'Formatting: Complex tables detected', deduction: 2 });
    if (hasIssue('image') || hasIssue('unreadable')) deductionsList.push({ name: 'Formatting: Image-heavy or unreadable content', deduction: 3 });
    if (hasIssue('heading')) deductionsList.push({ name: 'Formatting: Missing clear headings', deduction: 2 });
    if (hasIssue('paragraph')) deductionsList.push({ name: 'Formatting: Very long paragraphs', deduction: 1 });
    if (hasIssue('symbol') || hasIssue('noise')) deductionsList.push({ name: 'Formatting: Unusual symbols or formatting noise', deduction: 1 });
    if (hasIssue('extraction')) deductionsList.push({ name: 'Formatting: Poor text extraction quality', deduction: 3 });

    // 6. Achievement Score
    const ach = result.achievement_quality;
    if (ach) {
      if (!ach.has_numbers) deductionsList.push({ name: 'No measurable metrics or numbers in achievements', deduction: 4 });
      if (!ach.has_action_verbs) deductionsList.push({ name: 'No strong action verbs in achievements', deduction: 3 });
      if (!ach.has_impact_statements) deductionsList.push({ name: 'No impact/result-based statements in achievements', deduction: 3 });
    }

    return deductionsList;
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

  const suggestedChanges = scanResult ? buildSuggestedChanges(scanResult.issues) : [];
  const canPreviewRevisedResume = Boolean(scannedResumeText && suggestedChanges.length > 0);
  const diffParts = canPreviewRevisedResume
    ? buildDiffParts(scannedResumeText, suggestedChanges)
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
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
                <Card key={item.id} className="p-5 flex items-center justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {item.job_role ? `Role: ${item.job_role}` : 'General Resume Quality Check'}
                      </span>
                      <Badge variant={
                        item.confidence_level === 'High' ? 'success' : item.confidence_level === 'Medium' ? 'warning' : 'default'
                      }>
                        {item.confidence_level} Confidence
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                      {item.final_score}
                      <span className="text-sm text-neutral-500 font-normal">/100</span>
                    </p>
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

              {/* Target Job Role */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1">
                  <Target className="w-4 h-4 text-neutral-500" />
                  Target Job Role <span className="text-xs text-neutral-500 font-normal ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g., Software Engineer, Data Scientist, Marketing Manager"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Job URL Fetcher */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Paste job link <span className="text-xs text-neutral-500 font-normal">(Optional)</span></label>
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
                label="Job Description (Optional)"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                placeholder="Paste the job description here..."
              />
            </div>
          </div>

          <div className="mt-10 mb-4 border-t border-neutral-200 dark:border-neutral-800 pt-8">
            {/* Soft suggestion when no JD */}
            {!jobDescription.trim() && !jobRole.trim() && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg max-w-2xl">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  💡 Provide a job description or job role to get a tailored ATS match score and missing keywords list.
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
              NextStep compares your resume with job requirements using transparent scoring formulas and detailed AI analysis.
            </p>
          </div>

          {/* Results Section */}
          {showResults && scanResult && (
            <div className="mt-8 space-y-8 animate-fadeIn">
              {/* Incomplete Analysis Warning */}
              {scanResult.warning && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-300">Analysis Incomplete</h4>
                    <p className="text-sm text-amber-800 dark:text-amber-400 mt-1">{scanResult.warning}</p>
                  </div>
                </div>
              )}

              {/* Header Card: Score Display + Trust Statement */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 md:col-span-1 flex flex-col items-center justify-center text-center">
                  <ScoreGauge
                    score={scanResult.final_score}
                    label={
                      scanResult.confidence_level === 'High'
                        ? 'ATS Compatibility Score'
                        : scanResult.confidence_level === 'Medium'
                        ? 'Role Match Score'
                        : 'Resume Quality Score'
                    }
                  />
                  <div className="mt-4 flex flex-col items-center">
                    <span className="text-neutral-900 dark:text-white font-medium text-lg">
                      {scanResult.final_score}/100 Overall Score
                    </span>
                    <div className="mt-2">
                      <Badge variant={
                        scanResult.confidence_level === 'High' ? 'success' : scanResult.confidence_level === 'Medium' ? 'warning' : 'default'
                      }>
                        {scanResult.confidence_level} Confidence
                      </Badge>
                    </div>
                    
                    {/* Projected score inline indicator */}
                    <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-neutral-200 bg-white text-left shadow-sm dark:border-neutral-700 dark:bg-neutral-900 w-full max-w-xs">
                      <div className="border-r border-neutral-200 px-3 py-2 dark:border-neutral-700 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Current</p>
                        <p className="mt-0.5 text-base font-bold text-neutral-900 dark:text-white">{scanResult.final_score}/100</p>
                      </div>
                      <div className="px-3 py-2 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600">After changes</p>
                        <p className="mt-0.5 text-base font-bold text-green-700 dark:text-green-300">{scanResult.projectedScore}/100</p>
                      </div>
                    </div>
                    <p className="text-neutral-500 text-[10px] text-center mt-2 max-w-xs">
                      Estimated score after applying the suggested keywords and CV edits.
                    </p>
                  </div>
                </Card>

                <Card className="p-6 md:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-primary-600 dark:text-primary-400">
                      <ShieldCheck className="w-6 h-6" />
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Why NextStep is Transparent</h3>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
                      “NextStep does not use fake AI scoring. AI analyzes your resume deeply, but your final score is calculated using a transparent scoring formula. This makes the result more consistent, explainable, and trustworthy.”
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <span className="font-semibold text-xs text-neutral-500 uppercase tracking-wider block mb-1">
                      Scoring Formula Breakdown
                    </span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      Keywords Match (30) + Skills Match (20) + Experience Relevance (15) + Structure (15) + ATS Formatting (10) + Achievement Quality (10) = 100 total points.
                    </p>
                  </div>
                </Card>
              </div>

              {/* Granular Score Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Keywords Match */}
                <Card className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-neutral-900 dark:text-white">Keyword Match</h4>
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">
                        {Math.round(scanResult.keyword_score)}<span className="text-xs text-neutral-500 font-normal">/30</span>
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-4">
                      Compares important terms from the target job / field against your resume text.
                    </p>
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded">
                    Matched {scanResult.matched_keywords?.length || 0} of {scanResult.required_keywords?.length || (scanResult.matched_keywords?.length + scanResult.missing_keywords?.length) || 0} required keywords.
                  </div>
                </Card>

                {/* 2. Skills Match */}
                <Card className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-neutral-900 dark:text-white">Skills Match</h4>
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">
                        {Math.round(scanResult.skills_score)}<span className="text-xs text-neutral-500 font-normal">/20</span>
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-4">
                      Analyzes skill coverage against target job requirements or industry standards.
                    </p>
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded">
                    Matched {scanResult.matched_skills?.length || 0} of {scanResult.required_skills?.length || (scanResult.matched_skills?.length + scanResult.missing_skills?.length) || 0} required skills.
                  </div>
                </Card>

                {/* 3. Experience Relevance */}
                <Card className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-neutral-900 dark:text-white">Experience Relevance</h4>
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">
                        {scanResult.experience_score}<span className="text-xs text-neutral-500 font-normal">/15</span>
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-4">
                      Evaluates the relevance of your career path to the target role.
                    </p>
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded capitalize">
                    Relevance Rating: <span className="font-semibold">{scanResult.experience_relevance?.label || 'not found'}</span>
                  </div>
                </Card>

                {/* 4. Resume Structure */}
                <Card className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-neutral-900 dark:text-white">Resume Structure</h4>
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">
                        {scanResult.structure_score}<span className="text-xs text-neutral-500 font-normal">/15</span>
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-4">
                      Checks for key resume sections required by recruiters and standard ATS parsers.
                    </p>
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded">
                    Found {Object.values(scanResult.resume_sections_found || {}).filter(Boolean).length} of 7 critical resume sections.
                  </div>
                </Card>

                {/* 5. ATS Formatting */}
                <Card className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-neutral-900 dark:text-white">ATS Formatting</h4>
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">
                        {scanResult.formatting_score}<span className="text-xs text-neutral-500 font-normal">/10</span>
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-4">
                      Checks for tables, symbols, or structure blocks that break text extraction.
                    </p>
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded">
                    Detected {scanResult.formatting_issues?.length || 0} formatting obstacles.
                  </div>
                </Card>

                {/* 6. Achievement Quality */}
                <Card className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-neutral-900 dark:text-white">Achievement Quality</h4>
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">
                        {scanResult.achievement_score}<span className="text-xs text-neutral-500 font-normal">/10</span>
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-4">
                      Evaluates bullet points for metrics, strong action verbs, and impact.
                    </p>
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded">
                    Passed {Object.values(scanResult.achievement_quality || {}).filter(v => v === true).length} of 3 quality indicators.
                  </div>
                </Card>
              </div>

              {/* Deductions & Issues Card */}
              {getDeductions(scanResult).length > 0 && (
                <Card className="p-6 border-red-200 dark:border-red-900 bg-red-50/10">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Points Deducted & Issues Found
                  </h3>
                  <div className="space-y-3">
                    {getDeductions(scanResult).map((deduction, index) => (
                      <div key={index} className="flex justify-between items-center text-sm border-b border-neutral-100 dark:border-neutral-800 pb-2">
                        <span className="text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          {deduction.name}
                        </span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          -{Math.round(deduction.deduction)} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Keyword & Skill Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Keywords Card */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-primary-500" />
                    Keywords Match Review
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-500 mb-2 uppercase tracking-wide">Matched Keywords ({scanResult.matched_keywords?.length || 0})</h4>
                      <div className="flex flex-wrap gap-2">
                        {scanResult.matched_keywords?.length > 0 ? (
                          scanResult.matched_keywords.map((kw, i) => (
                            <Badge key={i} variant="success">{kw}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-neutral-400">None matched yet.</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-500 mb-2 uppercase tracking-wide">Missing Keywords ({scanResult.missing_keywords?.length || 0})</h4>
                      <div className="flex flex-wrap gap-2">
                        {scanResult.missing_keywords?.length > 0 ? (
                          scanResult.missing_keywords.map((kw, i) => (
                            <Badge key={i} variant="warning">{kw}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-neutral-400">No missing keywords! Perfect match.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Skills Card */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-500" />
                    Required Skills Review
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-500 mb-2 uppercase tracking-wide">Matched Skills ({scanResult.matched_skills?.length || 0})</h4>
                      <div className="flex flex-wrap gap-2">
                        {scanResult.matched_skills?.length > 0 ? (
                          scanResult.matched_skills.map((skill, i) => (
                            <Badge key={i} variant="success">{skill}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-neutral-400">None matched yet.</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-500 mb-2 uppercase tracking-wide">Missing Skills ({scanResult.missing_skills?.length || 0})</h4>
                      <div className="flex flex-wrap gap-2">
                        {scanResult.missing_skills?.length > 0 ? (
                          scanResult.missing_skills.map((skill, i) => (
                            <Badge key={i} variant="warning">{skill}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-neutral-400">No missing skills! Perfect match.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Sections Checklist & Formatting Obstacles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-emerald-500" />
                    Resume Sections Checklist
                  </h3>
                  <div className="space-y-3">
                    {Object.entries({
                      'Contact Details (3 pts)': scanResult.resume_sections_found?.contact,
                      'Professional Summary / Objective (2 pts)': scanResult.resume_sections_found?.summary,
                      'Skills List (3 pts)': scanResult.resume_sections_found?.skills,
                      'Work Experience Section (3 pts)': scanResult.resume_sections_found?.experience,
                      'Projects / Achievements Section (3 pts)': scanResult.resume_sections_found?.projects,
                      'Education History (2 pts)': scanResult.resume_sections_found?.education,
                      'Certifications / Extra Sections (2 pts)': scanResult.resume_sections_found?.certifications,
                    }).map(([label, present], i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800 text-sm">
                        <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
                        {present ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-neutral-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    ATS Formatting Obstacles
                  </h3>
                  <div className="space-y-4">
                    {scanResult.formatting_issues?.length > 0 ? (
                      <div className="space-y-3">
                        {scanResult.formatting_issues.map((issue, idx) => (
                          <div key={idx} className="flex gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
                            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span className="text-neutral-700 dark:text-neutral-300">
                              {getFormattingIssueLabel(issue)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h4 className="font-semibold text-neutral-900 dark:text-white">Clean ATS Structure</h4>
                        <p className="text-sm text-neutral-500 mt-1">No major formatting roadblocks detected.</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Achievement Quality & Actionable Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Achievement Quality */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-500" />
                    Achievement Quality Review
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`p-3 rounded-lg border text-center ${scanResult.achievement_quality?.has_numbers ? 'bg-green-500/10 border-green-500/20' : 'bg-neutral-100 border-transparent dark:bg-neutral-800'}`}>
                        <span className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">Metrics</span>
                        <span className="block text-sm font-bold mt-1 text-neutral-900 dark:text-white">
                          {scanResult.achievement_quality?.has_numbers ? 'Passed' : 'Missing'}
                        </span>
                      </div>
                      <div className={`p-3 rounded-lg border text-center ${scanResult.achievement_quality?.has_action_verbs ? 'bg-green-500/10 border-green-500/20' : 'bg-neutral-100 border-transparent dark:bg-neutral-800'}`}>
                        <span className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">Action Verbs</span>
                        <span className="block text-sm font-bold mt-1 text-neutral-900 dark:text-white">
                          {scanResult.achievement_quality?.has_action_verbs ? 'Passed' : 'Missing'}
                        </span>
                      </div>
                      <div className={`p-3 rounded-lg border text-center ${scanResult.achievement_quality?.has_impact_statements ? 'bg-green-500/10 border-green-500/20' : 'bg-neutral-100 border-transparent dark:bg-neutral-800'}`}>
                        <span className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">Impact</span>
                        <span className="block text-sm font-bold mt-1 text-neutral-900 dark:text-white">
                          {scanResult.achievement_quality?.has_impact_statements ? 'Passed' : 'Missing'}
                        </span>
                      </div>
                    </div>

                    {scanResult.achievement_quality?.examples_found?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">AI Observations on Bullet Points</h4>
                        <ul className="space-y-2">
                          {scanResult.achievement_quality.examples_found.map((example, i) => (
                            <li key={i} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2 bg-neutral-50 dark:bg-neutral-900 p-2 rounded">
                              <span>•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Suggestions */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-yellow-500" />
                    Actionable Improvement Suggestions
                  </h3>
                  <ul className="space-y-3">
                    {scanResult.suggestions?.length > 0 ? (
                      scanResult.suggestions.map((sug, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                          <span className="text-yellow-500 flex-shrink-0 mt-0.5">•</span>
                          <span>{sug}</span>
                        </li>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-500">Your resume is perfectly aligned. No suggestions needed!</p>
                    )}
                  </ul>
                </Card>
              </div>

              {/* Bullet Suggestion & Rewrites */}
              {scanResult.better_bullet_suggestions?.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                    AI Bullet Point Rewrite Examples
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scanResult.better_bullet_suggestions.map((bullet, idx) => (
                      <div key={idx} className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-sm">
                        <p className="italic text-neutral-700 dark:text-neutral-300 font-medium">"{bullet}"</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Section-Wise Guidance */}
              {scanResult.section_wise_guidance?.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                    Section-by-Section Guidance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scanResult.section_wise_guidance.map((guidance, idx) => (
                      <div key={idx} className="flex gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                        <span className="text-primary-500 font-bold">•</span>
                        <span>{guidance}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Tracked Changes and Printer Preview Section (IMPORTANT FEATURE TO PRESERVE) */}
              {(scanResult.issues?.length > 0 || suggestedChanges.length > 0) && (
                <Card className="p-6 border-indigo-200 dark:border-indigo-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
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
                          scanResult.improvedSummary || scanResult.improved_summary_suggestion,
                          scanResult.missing_keywords || scanResult.missingKeywords,
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

                  {scanResult.issues?.length > 0 && (
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

              {/* Transparency Disclaimer Footer */}
              <div className="text-center p-6 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 max-w-4xl mx-auto">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {`“This score is calculated using keyword match, skills coverage, resume structure, ATS-readable formatting, and achievement quality. It is not a guarantee of selection, but it helps you understand how ready your resume is for ATS screening.”`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScannerPage;
