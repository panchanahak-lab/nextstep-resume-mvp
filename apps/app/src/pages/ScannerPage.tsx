import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, Search, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Card from '../../../../packages/shared/src/components/Card';
import Button from '../../../../packages/shared/src/components/Button';
import Badge from '../../../../packages/shared/src/components/Badge';
import Textarea from '../../../../packages/shared/src/components/Textarea';
import ScoreGauge from '../components/ScoreGauge';
import { COPY } from '@nextstep/shared';
import { extractTextFromFile } from '../utils/documentParser';
import { analyzeResume, type ATSScanResult } from '../services/aiScanner';

const ScannerPage: React.FC = () => {
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
  const [scanResult, setScanResult] = useState<ATSScanResult | null>(null);

  const handleScan = async () => {
    setScanError('');
    setShowResults(false);

    if (!file && !resumeText.trim()) {
      setScanError('Please add your resume to continue');
      return;
    }

    if (!jobDescription.trim()) {
      setScanError('Please add a job description to continue');
      return;
    }

    setIsScanning(true);
    try {
      let finalResumeText = resumeText;
      if (file && !resumeText.trim()) {
        finalResumeText = await extractTextFromFile(file);
      }

      const result = await analyzeResume(finalResumeText, jobDescription);
      setScanResult(result);
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
    // Simulate fetch delay
    setTimeout(() => {
      setIsFetching(false);
      setJobDescription('This is a simulated fetched job description. We are looking for a skilled candidate with experience in React, TypeScript, and Tailwind CSS. You will be responsible for building responsive UI components and integrating with backend APIs.');
      setUrlSuccess('Job details fetched successfully');
    }, 1500);
  };

  return (
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
              <ScoreGauge score={scanResult.score} label="ATS Compatibility Score" />
              <p className="mt-4 text-neutral-900 font-medium">You are {scanResult.score}/100 ready for this job</p>
              <p className="text-neutral-500 mt-1">
                {scanResult.score >= 80 ? COPY.ATS.highScore : scanResult.score >= 50 ? COPY.ATS.midScore : COPY.ATS.lowScore}
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
                {scanResult.strengths.map((item, index) => (
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
                {scanResult.missingKeywords.length > 0 ? (
                  scanResult.missingKeywords.map((keyword, index) => (
                    <Badge key={index}>{keyword}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500">No critical missing keywords found.</p>
                )}
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
                {scanResult.suggestions.length > 0 ? (
                  scanResult.suggestions.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                      <span className="text-yellow-500 flex-shrink-0">•</span>
                      {item}
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500">Your resume perfectly matches the job description!</p>
                )}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;
