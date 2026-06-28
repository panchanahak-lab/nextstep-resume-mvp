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

const getHighlightedParts = (originalResume: string, revisedResume: string, changes: SuggestedChange[]) => {
  const matches = changes
    .map((change) => {
      const index = revisedResume.indexOf(change.replacement);
      return index >= 0
        ? { index, text: change.replacement, original: change.original }
        : null;
    })
    .filter((match): match is { index: number; text: string; original: string } => Boolean(match))
    .sort((a, b) => a.index - b.index);

  const parts: Array<{ text: string; changed: boolean; original?: string }> = [];
  let cursor = 0;

  matches.forEach((match) => {
    if (match.index < cursor) return;
    if (match.index > cursor) {
      parts.push({ text: revisedResume.slice(cursor, match.index), changed: false });
    }
    parts.push({ text: match.text, changed: true, original: match.original });
    cursor = match.index + match.text.length;
  });

  if (cursor < revisedResume.length) {
    parts.push({ text: revisedResume.slice(cursor), changed: false });
  }

  return parts.length > 0 ? parts : [{ text: originalResume, changed: false }];
};

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

  const printRevisedResume = (revisedResume: string, changes: SuggestedChange[]) => {
    const highlightedHtml = changes.reduce((html, change) => {
      if (!change.replacement) return html;
      return html.replace(
        escapeHtml(change.replacement),
        `<mark>${escapeHtml(change.replacement)}</mark>`,
      );
    }, escapeHtml(revisedResume));

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100');
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>NextStep Revised Resume</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; padding: 32px; line-height: 1.45; }
            h1 { font-size: 18px; margin-bottom: 16px; }
            pre { white-space: pre-wrap; font-family: inherit; font-size: 12px; }
            mark { background: #dcfce7; color: #166534; padding: 1px 3px; border-radius: 3px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Revised Resume Draft</h1>
          <pre>${highlightedHtml}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
  const revisedResumeText = scannedResumeText && suggestedChanges.length > 0
    ? applySuggestedChanges(scannedResumeText, suggestedChanges)
    : scannedResumeText;
  const highlightedResumeParts = scannedResumeText && revisedResumeText
    ? getHighlightedParts(scannedResumeText, revisedResumeText, suggestedChanges)
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
                {revisedResumeText && suggestedChanges.length > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => printRevisedResume(revisedResumeText, suggestedChanges)}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print revised draft
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

              {scannedResumeText && suggestedChanges.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-white">Highlighted revised draft</h4>
                  <div className="max-h-[520px] overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                      {highlightedResumeParts.map((part, index) => (
                        part.changed ? (
                          <mark
                            key={`${part.text}-${index}`}
                            className="rounded bg-green-100 px-1 text-green-900 dark:bg-green-900/50 dark:text-green-100"
                            title={part.original ? `Original: ${part.original}` : undefined}
                          >
                            {part.text}
                          </mark>
                        ) : (
                          <React.Fragment key={`${part.text}-${index}`}>{part.text}</React.Fragment>
                        )
                      ))}
                    </pre>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Highlighted words are AI-suggested replacements. Review before using the draft.
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
