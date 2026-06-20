import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, CheckCircle, ChevronDown, ChevronUp, AlertCircle, Clock, Loader2 } from 'lucide-react';
import type { InterviewMessage } from '../../../../packages/shared/src/types';
import Card from '../../../../packages/shared/src/components/Card';
import Button from '../../../../packages/shared/src/components/Button';
import Badge from '../../../../packages/shared/src/components/Badge';
import InterviewChat from '../components/InterviewChat';
import { COPY, getSupabaseClient } from '@nextstep/shared';
import { extractTextFromFile } from '../utils/documentParser';

const DEFAULT_ROLES = [
  "Software Developer", "Sales Executive", "Marketing Manager", "HR Manager", 
  "Teacher / Lecturer", "Accountant", "Civil Engineer", "Mechanical Engineer", 
  "Electrical Engineer", "Project Manager", "Data Analyst", "Operations Manager", 
  "Business Development Executive", "Customer Support Executive", "Content Writer", 
  "Nurse / Healthcare Worker", "Graphic Designer", "Fresher / Any Role"
];

function RoleAutocomplete({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredRoles = DEFAULT_ROLES.filter(role => role.toLowerCase().includes(value.toLowerCase()));

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder="Type your job role or search from suggestions"
        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg">
          {filteredRoles.map((r) => (
            <li
              key={r}
              onClick={() => { onChange(r); setIsOpen(false); }}
              className="px-3 py-2 text-sm text-neutral-900 dark:text-white hover:bg-primary-50 dark:hover:bg-primary-900 cursor-pointer"
            >
              {r}
            </li>
          ))}
          {filteredRoles.length === 0 && value.trim() && (
            <li 
              className="px-3 py-2 text-sm text-neutral-900 dark:text-white hover:bg-primary-50 dark:hover:bg-primary-900 cursor-pointer italic"
              onClick={() => setIsOpen(false)}
            >
              Use custom role: "{value}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

const mockQuestions = [
  'Can you walk me through a recent data center cooling project you managed?',
  'How do you calculate the cooling load for a server room?',
  'What is the significance of PUE in data center design?',
  'How do you handle hot spots in a data center floor?',
  'Describe your experience with BMS integration for HVAC systems.',
];

interface InterviewHistoryItem {
  id: string;
  created_at: string;
  job_role: string;
  score: number;
  top_tip: string;
}

const InterviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'interview' | 'history'>('interview');
  
  const [role, setRole] = useState('Mechanical Engineer');
  const [difficulty, setDifficulty] = useState<'Basic' | 'Moderate' | 'High'>('Moderate');
  const [questionCount, setQuestionCount] = useState(5);
  const [language, setLanguage] = useState('English');
  
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Timer & Silence Detection
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceRef = useRef<NodeJS.Timeout | null>(null);

  // History State
  const [historyItems, setHistoryItems] = useState<InterviewHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showResults, setShowResults] = useState(false);

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
        .from('interviews')
        .select('id, created_at, job_role, score, top_tip')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setHistoryItems(data as InterviewHistoryItem[]);
      }
    } catch (e) {
      console.error('Error fetching history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
      setFileError('Please upload a PDF or DOCX file only');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File is too large. Please keep it under 5MB');
      return;
    }

    setResumeFile(file);
    setIsParsing(true);
    try {
      const result = await extractTextFromFile(file);
      if (result.text) {
        setResumeText(result.text);
      }
      if (result.warning) {
        setFileError(result.warning);
      }
    } catch (err) {
      setFileError('Error reading file.');
    } finally {
      setIsParsing(false);
    }
  };

  const startTimer = useCallback(() => {
    // Basic = 15m, Moderate = 30m, High = 45m
    const minutes = difficulty === 'Basic' ? 15 : difficulty === 'Moderate' ? 30 : 45;
    setTimeLeft(minutes * 60);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [difficulty]);

  const resetSilenceDetection = useCallback(() => {
    setLastActivity(Date.now());
    if (silenceRef.current) clearInterval(silenceRef.current);
    
    silenceRef.current = setInterval(() => {
      const inactiveFor = Math.floor((Date.now() - lastActivity) / 1000);
      
      // Auto-prompt after 30s
      if (inactiveFor === 30 && isStarted && !showResults) {
        setMessages(prev => [
          ...prev, 
          { id: Date.now().toString(), role: 'interviewer', content: 'Are you still there? Please take your time to answer.', timestamp: new Date().toISOString() }
        ]);
      }
      // Skip after 60s
      if (inactiveFor >= 60 && isStarted && !showResults) {
        handleNextQuestion();
      }
    }, 1000);
  }, [lastActivity, isStarted, showResults]);

  useEffect(() => {
    if (isStarted && !showResults) {
      resetSilenceDetection();
    }
    return () => {
      if (silenceRef.current) clearInterval(silenceRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, showResults, messages, resetSilenceDetection]);

  const handleStartInterview = () => {
    setIsStarted(true);
    setShowResults(false);
    setMessages([
      {
        id: Date.now().toString(),
        role: 'interviewer',
        content: `Welcome to the mock interview for the ${role} position. Let's begin. Tell me about yourself and your relevant experience.`,
        timestamp: new Date().toISOString(),
      },
    ]);
    setQuestionIndex(0);
    startTimer();
    setLastActivity(Date.now());
  };

  const handleNextQuestion = () => {
    if (questionIndex >= questionCount - 1) {
      handleEndInterview();
      return;
    }
    const question = mockQuestions[questionIndex % mockQuestions.length];
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'interviewer',
        content: question,
        timestamp: new Date().toISOString(),
      },
    ]);
    setQuestionIndex((prev) => prev + 1);
    setLastActivity(Date.now());
  };

  const handleSendMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'candidate',
        content,
        timestamp: new Date().toISOString(),
      },
    ]);
    setLastActivity(Date.now());
    
    // Simulate interviewer responding after user message
    setTimeout(() => {
      handleNextQuestion();
    }, 2000);
  };

  const handleEndInterview = async () => {
    setIsStarted(false);
    setShowResults(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (silenceRef.current) clearInterval(silenceRef.current);

    // Save history
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('interviews').insert({
        user_id: user.id,
        job_role: role,
        score: 78,
        top_tip: "Focus more on STAR method formatting for your answers."
      });
    } catch (e) {
      console.error('Failed to save interview history', e);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const selectClasses = 'w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  return (
    <div>
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-6">
        <button
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'interview'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
          onClick={() => setActiveTab('interview')}
        >
          Mock Interview
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
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Your Past Interviews</h2>
          {loadingHistory ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
          ) : historyItems.length > 0 ? (
            <div className="space-y-4">
              {historyItems.map((item) => (
                <Card key={item.id} className="p-4 flex items-center justify-between">
                  <div>
                    <Badge>{item.job_role}</Badge>
                    <p className="text-sm text-neutral-500 mt-2">{new Date(item.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">Tip: {item.top_tip}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{item.score}<span className="text-sm text-neutral-500 font-normal">/100</span></p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-neutral-500">
              No previous interviews found.
            </Card>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{COPY.INTERVIEW.headline}</h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">{COPY.INTERVIEW.supportText}</p>
            </div>
            {isStarted && (
              <div className="text-right">
                <span className={`text-xl font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
                  {formatTime(timeLeft)}
                </span>
                <p className="text-xs text-neutral-500">Time Remaining</p>
              </div>
            )}
          </div>

          {!isStarted && !showResults && (
            <>
              {/* Settings */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Your Job Role</label>
                  <RoleAutocomplete value={role} onChange={setRole} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className={selectClasses}>
                    <option>Basic</option>
                    <option>Moderate</option>
                    <option>High</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Questions</label>
                  <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className={selectClasses}>
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Result Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectClasses}>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Odia</option>
                    <option>Bengali</option>
                    <option>Tamil</option>
                    <option>Telugu</option>
                    <option>Kannada</option>
                    <option>Marathi</option>
                    <option>Gujarati</option>
                    <option>Malayalam</option>
                  </select>
                </div>
              </div>

              {/* Resume Upload Section */}
              <div className="mt-6 lg:max-w-3xl border-b border-neutral-200 dark:border-neutral-800 pb-8">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Your Resume <span className="text-neutral-500 font-normal">(optional but recommended)</span>
                </label>
                <p className="text-xs text-neutral-500 mb-3">
                  Upload your resume so the AI can ask questions based on your actual experience and background.
                </p>

                {resumeFile ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                        {resumeFile.name}
                        <button onClick={() => { setResumeFile(null); setResumeText(''); }} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-xs underline focus:outline-none">Remove</button>
                      </p>
                      {isParsing ? (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Parsing...</p>
                      ) : (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Resume extracted. AI will now personalise your interview.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <UploadCloud className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">Upload Resume</p>
                    <p className="text-xs text-neutral-500 mb-4">PDF or DOCX, max 5MB</p>
                    <label className="inline-block px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                      Choose File
                      <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                    </label>
                    {fileError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{fileError}</p>}
                  </div>
                )}

                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden mt-4">
                  <button 
                    className="w-full flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none"
                    onClick={() => setIsTextExpanded(!isTextExpanded)}
                  >
                    <span>Resume Text</span>
                    {isTextExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {isTextExpanded && (
                    <div className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste your resume text here if you prefer not to upload a file"
                        className="w-full h-32 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      ></textarea>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <Button variant="primary" className="px-8 py-3 text-lg" onClick={handleStartInterview}>
                  Start Mock Interview
                </Button>
              </div>
            </>
          )}

          {/* Main Content */}
          {(isStarted || showResults) && (
            <div className="lg:grid lg:grid-cols-3 gap-6 mt-6">
              {/* Chat - 2 columns */}
              <div className="lg:col-span-2">
                <div className="flex gap-3 mb-4">
                  {isStarted && (
                    <>
                      <Button variant="secondary" onClick={handleNextQuestion}>Skip Question</Button>
                      <Button variant="secondary" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handleEndInterview}>End Interview</Button>
                    </>
                  )}
                </div>
                <Card>
                  <InterviewChat messages={messages} onSendMessage={handleSendMessage} />
                </Card>
              </div>

              {/* Feedback - 1 column */}
              {showResults && (
                <div className="mt-6 lg:mt-0">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">{COPY.INTERVIEW_RESULT.headline}</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{COPY.INTERVIEW_RESULT.encouragement}</p>

                    {/* Score */}
                    <div className="mb-4">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">Score</span>
                      <p className="text-2xl font-bold text-primary-600">78/100</p>
                    </div>

                    {/* Feedback displayed in the selected language conceptually */}
                    <div className="mb-4">
                      <Badge className="mb-4">Results generated in: {language}</Badge>
                      <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Strengths</h4>
                      <ul className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
                        <li>• Clear and structured response</li>
                        <li>• Good use of quantified achievements</li>
                        <li>• Demonstrated domain expertise</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">Areas for Improvement</h4>
                      <ul className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
                        <li>• Could elaborate more on specific technologies</li>
                        <li>• Add more STAR method examples</li>
                      </ul>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewPage;
