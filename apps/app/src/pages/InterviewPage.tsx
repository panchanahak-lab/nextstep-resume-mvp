import React, { useState } from 'react';
import type { InterviewMessage } from '../../../../packages/shared/src/types';
import Card from '../../../../packages/shared/src/components/Card';
import Button from '../../../../packages/shared/src/components/Button';
import InterviewChat from '../components/InterviewChat';
import { mockInterviewMessages } from '../data/mockData';

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
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={selectClasses}>
            <option>Mechanical Engineer</option>
            <option>Data Center Project Engineer</option>
            <option>Project Manager</option>
            <option>HVAC Engineer</option>
            <option>Electrical Engineer</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectClasses}>
            <option>HR</option>
            <option>Technical</option>
            <option>Resume-based</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Language</label>
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

      {/* Main Content */}
      <div className="lg:grid lg:grid-cols-3 gap-6 mt-6">
        {/* Chat - 2 columns */}
        <div className="lg:col-span-2">
          <div className="flex gap-3 mb-4">
            <Button variant="primary" onClick={handleStartInterview}>Start Interview</Button>
            <Button variant="secondary" onClick={handleNextQuestion}>Next Question</Button>
          </div>
          <Card>
            <InterviewChat messages={messages} onSendMessage={handleSendMessage} />
          </Card>
        </div>

        {/* Feedback - 1 column */}
        <div className="mt-6 lg:mt-0">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">AI Feedback</h3>

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
