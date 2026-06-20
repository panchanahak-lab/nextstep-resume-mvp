import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { InterviewMessage } from '../../../../packages/shared/src/types';
import Card from '../../../../packages/shared/src/components/Card';
import Button from '../../../../packages/shared/src/components/Button';
import InterviewChat from '../components/InterviewChat';
import { mockInterviewMessages } from '../data/mockData';
import { COPY } from '@nextstep/shared';

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

  const handleSelect = (role: string) => {
    onChange(role);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder="Type your job role or search from suggestions"
        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg">
          {filteredRoles.length > 0 ? (
            filteredRoles.map((r) => (
              <li
                key={r}
                onClick={() => handleSelect(r)}
                className="px-3 py-2 text-sm text-neutral-900 dark:text-white hover:bg-primary-50 dark:hover:bg-primary-900 cursor-pointer"
              >
                {r}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400 italic">
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

const InterviewPage: React.FC = () => {
  const [role, setRole] = useState('Mechanical Engineer');
  const [type, setType] = useState('Technical');
  const [language, setLanguage] = useState('English');
  const [messages, setMessages] = useState<InterviewMessage[]>(mockInterviewMessages);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
      setFileError('Please upload a PDF or DOCX file only');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File is too large. Please keep it under 5MB');
      return;
    }

    setResumeFile(file);
  };

  const handleStartInterview = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'interviewer',
        content: `Welcome to the ${type} interview for the ${role} position. Let's begin. Tell me about yourself and your relevant experience.`,
        timestamp: new Date().toISOString(),
      },
    ]);
    setQuestionIndex(0);
  };

  const handleNextQuestion = () => {
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
  };

  const selectClasses = 'w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{COPY.INTERVIEW.headline}</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">{COPY.INTERVIEW.supportText}</p>
        <p className="text-sm text-primary-600 font-medium mt-1">{COPY.INTERVIEW.warmupMessage}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Your Job Role</label>
          <RoleAutocomplete value={role} onChange={setRole} />
          <p className="text-xs text-neutral-500 mt-1">Not sure? Write the exact title from the job description you are applying for.</p>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectClasses}>
            <option>HR</option>
            <option>Technical</option>
            <option>Resume-based</option>
          </select>
          <p className="text-xs text-neutral-500 mt-1">{COPY.INTERVIEW.difficultyHelper}</p>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{COPY.INTERVIEW.languageHelper}</label>
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
      <div className="mt-6 lg:max-w-3xl">
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
                <button onClick={() => setResumeFile(null)} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-xs underline focus:outline-none">Remove</button>
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Resume uploaded. AI will now personalise your interview.</p>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
            <UploadCloud className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-neutral-900 dark:text-white">Upload Resume</p>
            <p className="text-xs text-neutral-500 mb-4">PDF or DOCX, max 5MB</p>
            <label className="inline-block px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
              Choose File
              <input type="file" className="hidden" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} />
            </label>
            {fileError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{fileError}</p>}
          </div>
        )}

        <div className="flex items-center gap-4 my-4">
          <div className="h-px bg-neutral-200 dark:bg-neutral-700 flex-1"></div>
          <span className="text-xs text-neutral-500">or paste your resume text below</span>
          <div className="h-px bg-neutral-200 dark:bg-neutral-700 flex-1"></div>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
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

        {!resumeFile && !resumeText && (
          <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              No resume added. Interview questions will be based on your job role only. Add a resume for a more personalised experience.
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="lg:grid lg:grid-cols-3 gap-6 mt-6">
        {/* Chat - 2 columns */}
        <div className="lg:col-span-2">
          <div className="flex gap-3 mb-4">
            <Button variant="primary" onClick={handleStartInterview}>{COPY.INTERVIEW.ctaStart}</Button>
            <Button variant="secondary" onClick={handleNextQuestion}>{COPY.INTERVIEW.ctaNext}</Button>
            <Button variant="secondary" onClick={() => alert('Skip functionality')}>{COPY.INTERVIEW.ctaSkip}</Button>
          </div>
          <Card>
            <InterviewChat messages={messages} onSendMessage={handleSendMessage} />
          </Card>
        </div>

        {/* Feedback - 1 column */}
        <div className="mt-6 lg:mt-0">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">{COPY.INTERVIEW_RESULT.headline}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{COPY.INTERVIEW_RESULT.encouragement}</p>

            {/* Score */}
            <div className="mb-4">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Score</span>
              <p className="text-2xl font-bold text-primary-600">78/100</p>
            </div>

            {/* Strengths */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Strengths</h4>
              <ul className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
                <li>• Clear and structured response</li>
                <li>• Good use of quantified achievements</li>
                <li>• Demonstrated domain expertise</li>
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">Areas for Improvement</h4>
              <ul className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
                <li>• Could elaborate more on specific technologies</li>
                <li>• Add more STAR method examples</li>
              </ul>
            </div>

            {/* Suggested Answer */}
            <div>
              <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Suggested Better Answer</h4>
              <div className="text-sm bg-neutral-50 dark:bg-neutral-800 p-3 rounded text-neutral-600 dark:text-neutral-400 leading-relaxed">
                "I have 8 years of progressive experience in HVAC and data center cooling, starting from junior engineering roles to leading teams of 5+ engineers. In my current role at DataTech Solutions, I designed and commissioned a 2MW precision cooling system for a Tier III facility, achieving 18% energy savings and maintaining 99.99% uptime..."
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
