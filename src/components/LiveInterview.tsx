import React, { useEffect, useRef, useState } from 'react';
import {
  getInterviewFeedback,
  getInterviewTurn,
  transcribeInterviewAnswer,
  type InterviewFeedback,
  type TranscriptItem,
} from '../lib/aiClient';

const LANGUAGES = [
  'English',
  'Hindi',
  'Gujarati',
  'Marathi',
  'Bhojpuri',
  'Tamil',
  'Telugu',
  'Bengali',
  'Odia',
  'Malayalam',
  'Kannada',
  'Assamese',
  'Nepali',
  'Punjabi',
  'Sindhi',
  'Kashmiri',
  'Urdu',
];

const LANGUAGE_CODES: Record<string, string> = {
  English: 'en-IN',
  Hindi: 'hi-IN',
  Gujarati: 'gu-IN',
  Marathi: 'mr-IN',
  Bhojpuri: 'hi-IN',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
  Bengali: 'bn-IN',
  Odia: 'or-IN',
  Malayalam: 'ml-IN',
  Kannada: 'kn-IN',
  Assamese: 'as-IN',
  Nepali: 'ne-NP',
  Punjabi: 'pa-IN',
  Sindhi: 'sd-IN',
  Kashmiri: 'ks-IN',
  Urdu: 'ur-IN',
};

type SessionStage = 'setup' | 'initializing' | 'interview' | 'processing_feedback' | 'feedback';
type InterviewStatus = 'speaking' | 'listening' | 'processing' | 'ready';

const TRANSCRIPTION_TIMEOUT_MS = 12000;
const FEMALE_VOICE_HINTS = ['female', 'zira', 'susan', 'heera', 'kalpana', 'google'];

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then(value => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch(error => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function getPreferredVoice(language: string) {
  const languageCode = LANGUAGE_CODES[language] || 'en-IN';
  const shortCode = languageCode.split('-')[0].toLowerCase();
  const voices = window.speechSynthesis.getVoices();
  const matching = voices.filter(voice => {
    const voiceLang = voice.lang.toLowerCase();
    return voiceLang === languageCode.toLowerCase() || voiceLang.startsWith(`${shortCode}-`);
  });
  const female = matching.find(voice =>
    FEMALE_VOICE_HINTS.some(hint => voice.name.toLowerCase().includes(hint)),
  );

  return female || matching[0] || null;
}

const LiveInterview: React.FC = () => {
  const [stage, setStage] = useState<SessionStage>('setup');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobRole, setJobRole] = useState('');
  const [language, setLanguage] = useState('English');
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [liveInputTranscript, setLiveInputTranscript] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [status, setStatus] = useState<InterviewStatus>('ready');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const transcriptsRef = useRef<TranscriptItem[]>([]);
  const browserSpeechFinalRef = useRef('');
  const browserSpeechInterimRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const recognitionActiveRef = useRef(false);
  const processingRef = useRef(false);
  const stoppedForFeedbackRef = useRef(false);

  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts]);

  useEffect(() => {
    if (stage !== 'interview') return;
    transcriptScrollRef.current?.scrollTo({
      top: transcriptScrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [stage, transcripts, liveInputTranscript, currentQuestion]);

  const displayedTranscripts = [
    ...transcripts,
    ...(liveInputTranscript.trim() ? [{ role: 'user' as const, text: liveInputTranscript }] : []),
  ];

  const cleanupSession = () => {
    window.speechSynthesis.cancel();
    stopBrowserSpeechRecognition();
    if (mediaRecorderRef.current?.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    recordingChunksRef.current = [];
    processingRef.current = false;
    setLiveInputTranscript('');
    setStatus('ready');
  };

  const stopBrowserSpeechRecognition = () => {
    recognitionActiveRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
  };

  const startBrowserSpeechRecognition = () => {
    stopBrowserSpeechRecognition();
    browserSpeechFinalRef.current = '';
    browserSpeechInterimRef.current = '';

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognitionActiveRef.current = true;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANGUAGE_CODES[language] || 'en-IN';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i]?.[0]?.transcript || '';
        if (event.results[i].isFinal) {
          browserSpeechFinalRef.current += `${text} `;
        } else {
          interim += text;
        }
      }

      browserSpeechInterimRef.current = interim;
      const combined = `${browserSpeechFinalRef.current}${interim}`.trim();
      if (combined) setLiveInputTranscript(combined);
    };

    recognition.onend = () => {
      if (!recognitionActiveRef.current || stoppedForFeedbackRef.current) return;
      window.setTimeout(() => {
        try { recognition.start(); } catch (e) {}
      }, 250);
    };

    try { recognition.start(); } catch (e) {}
  };

  const speakQuestion = (question: string) => {
    window.speechSynthesis.cancel();
    setStatus('speaking');
    setCurrentQuestion(question);

    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = LANGUAGE_CODES[language] || 'en-IN';
    const preferredVoice = getPreferredVoice(language);
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.92;
    utterance.pitch = 1;

    utterance.onend = () => {
      if (stage === 'feedback' || stoppedForFeedbackRef.current) return;
      startRecording();
    };

    utterance.onerror = () => {
      if (stage === 'feedback' || stoppedForFeedbackRef.current) return;
      startRecording();
    };

    window.speechSynthesis.speak(utterance);
  };

  const askNextQuestion = async (nextTranscripts: TranscriptItem[]) => {
    setStatus('processing');
    const question = await getInterviewTurn({ jobRole, language, transcripts: nextTranscripts });
    const updated = [...nextTranscripts, { role: 'ai' as const, text: question }];
    transcriptsRef.current = updated;
    setTranscripts(updated);
    speakQuestion(question);
  };

  const startInterviewFlow = async () => {
    if (!resumeFile || !jobRole.trim()) {
      alert('Please upload a resume and specify the job role.');
      return;
    }

    setStage('initializing');
    setIsError(false);
    setErrorMessage('');
    setTranscripts([]);
    transcriptsRef.current = [];
    stoppedForFeedbackRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      setStage('interview');
      await askNextQuestion([]);
    } catch (err: any) {
      console.error(err);
      cleanupSession();
      setStage('setup');
      setIsError(true);
      setErrorMessage(err.name === 'NotAllowedError'
        ? 'Microphone access denied. Please check your browser settings.'
        : 'Failed to start the interview. Please try again.');
    }
  };

  const startRecording = () => {
    const stream = mediaStreamRef.current;
    if (!stream || processingRef.current || stoppedForFeedbackRef.current) return;

    recordingChunksRef.current = [];
    const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? { mimeType: 'audio/webm;codecs=opus' }
      : undefined;
    const recorder = new MediaRecorder(stream, options);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = event => {
      if (event.data.size > 0) recordingChunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      if (!stoppedForFeedbackRef.current) {
        void processAnswer();
      }
    };

    recorder.start();
    startBrowserSpeechRecognition();
    setLiveInputTranscript('Listening...');
    setStatus('listening');
  };

  const finishAnswer = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === 'recording') {
      stopBrowserSpeechRecognition();
      recorder.stop();
      setStatus('processing');
      const browserText = `${browserSpeechFinalRef.current}${browserSpeechInterimRef.current}`.trim();
      setLiveInputTranscript(browserText || 'Processing your answer...');
      return;
    }

    if (status === 'speaking') {
      window.speechSynthesis.cancel();
      startRecording();
    }
  };

  const processAnswer = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setStatus('processing');
    const browserText = `${browserSpeechFinalRef.current}${browserSpeechInterimRef.current}`.trim();
    setLiveInputTranscript(browserText || 'Transcribing your answer...');

    try {
      const blob = new Blob(recordingChunksRef.current, {
        type: recordingChunksRef.current[0]?.type || 'audio/webm',
      });

      if (blob.size < 800) {
        setLiveInputTranscript('');
        processingRef.current = false;
        startRecording();
        return;
      }

      const transcript = browserText || await withTimeout(
        transcribeInterviewAnswer({
          language,
          audio: {
            mimeType: blob.type || 'audio/webm',
            data: await blobToBase64(blob),
          },
        }),
        TRANSCRIPTION_TIMEOUT_MS,
        'Transcription timed out.',
      );

      const answerText = transcript.trim();
      if (!answerText) {
        setLiveInputTranscript('');
        processingRef.current = false;
        startRecording();
        return;
      }

      const nextTranscripts = [...transcriptsRef.current, { role: 'user' as const, text: answerText }];
      transcriptsRef.current = nextTranscripts;
      setTranscripts(nextTranscripts);
      setLiveInputTranscript('');
      processingRef.current = false;
      await askNextQuestion(nextTranscripts);
    } catch (error) {
      console.error(error);
      processingRef.current = false;
      const fallbackText = browserText.trim();
      if (fallbackText) {
        const nextTranscripts = [...transcriptsRef.current, { role: 'user' as const, text: fallbackText }];
        transcriptsRef.current = nextTranscripts;
        setTranscripts(nextTranscripts);
        setLiveInputTranscript('');
        await askNextQuestion(nextTranscripts);
        return;
      }
      setLiveInputTranscript('');
      setIsError(true);
      setErrorMessage('Could not process that answer. Please try speaking again, then tap Done Answering.');
      startRecording();
    }
  };

  const stopAndFeedback = async () => {
    stoppedForFeedbackRef.current = true;
    const completeTranscripts = [...transcriptsRef.current];
    cleanupSession();
    setStage('processing_feedback');

    try {
      const feedbackResult = await getInterviewFeedback({ jobRole, transcripts: completeTranscripts });
      setFeedback(feedbackResult);
      setStage('feedback');
    } catch {
      setStage('setup');
      alert('Feedback generation failed.');
    }
  };

  const handleDownloadReport = () => {
    window.print();
  };

  return (
    <section id="interview" className="py-20 bg-navy-900 min-h-[800px] text-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,100,158,0.1),transparent)] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12 print:hidden">
          <h2 className="text-4xl font-bold mb-4 font-heading tracking-tight">AI Interview Coach</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Experience a high-pressure interview with our native AI agent. Practice, get scored, and improve instantly.</p>
        </div>

        <div className={`bg-slate-800/40 rounded-3xl border border-slate-700/50 backdrop-blur-md p-6 md:p-10 shadow-2xl ${stage === 'feedback' ? 'printable-content' : ''}`}>
          {stage === 'setup' && (
            <div className="max-w-md mx-auto space-y-6 animate-fade-in">
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5 text-sm text-slate-200">
                <p>For best results — use headphones, sit in a quiet room, and speak clearly. This feature works best on Chrome browser.</p>
              </div>
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-2xl p-5 text-sm text-slate-200">
                <p className="font-bold text-brand-300 mb-1">Warm-up</p>
                <p>Take one calm breath, then answer in this structure: situation, action, result. The AI interviewer will ask one question at a time and adapt to your response.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Target Job Role</label>
                  <input
                    value={jobRole}
                    onChange={e => setJobRole(e.target.value)}
                    className="w-full bg-navy-900/50 border border-slate-600 rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    placeholder="e.g. Project Manager"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Interview Language</label>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="w-full bg-navy-900/50 border border-slate-600 rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand-500 transition-all appearance-none"
                  >
                    {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Upload Resume (PDF/Word)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${resumeFile ? 'border-brand-500 bg-brand-500/5' : 'border-slate-600 hover:border-slate-400 hover:bg-slate-700/30'}`}
                  >
                    <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => e.target.files && setResumeFile(e.target.files[0])} />
                    <i className={`fas ${resumeFile ? 'fa-file-check text-brand-400' : 'fa-cloud-upload-alt text-slate-500'} text-3xl mb-3`}></i>
                    <p className="text-sm font-medium">{resumeFile ? resumeFile.name : 'Tap to browse files'}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={startInterviewFlow}
                className="w-full py-4 bg-brand-500 hover:bg-brand-600 rounded-xl font-bold text-lg shadow-lg shadow-brand-500/20 transition-all transform hover:-translate-y-1"
              >
                Start AI Interview
              </button>

              {isError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center flex items-center gap-3">
                  <i className="fas fa-exclamation-circle"></i>
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {stage === 'initializing' && (
            <div className="h-[400px] flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-brand-500/20 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-brand-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <p className="text-brand-400 font-medium animate-pulse">Starting interview...</p>
            </div>
          )}

          {stage === 'interview' && (
            <div className="grid lg:grid-cols-[1fr_350px] gap-8 animate-fade-in">
              <div className="flex flex-col">
                <div className="relative mb-6">
                  <div className="w-full h-48 bg-navy-900 rounded-2xl border border-slate-700/50 shadow-inner flex items-center justify-center">
                    <div className={`w-24 h-24 rounded-full border-4 ${status === 'listening' ? 'border-red-400 animate-pulse' : 'border-brand-500/40'} flex items-center justify-center`}>
                      <i className={`fas ${status === 'listening' ? 'fa-microphone' : status === 'speaking' ? 'fa-volume-up' : 'fa-brain'} text-3xl text-brand-300`}></i>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                      {status === 'listening' ? 'Recording' : status === 'speaking' ? 'Sarah Speaking' : 'Processing'}
                    </span>
                  </div>
                </div>

                <div className="bg-navy-900/50 p-6 rounded-2xl border border-slate-700/50 flex-grow min-h-[150px] flex flex-col justify-center text-center">
                  <p className="text-xs font-bold text-brand-400 mb-3 uppercase tracking-widest">Sarah (AI) Interviewer</p>
                  <p className="text-xl font-medium leading-relaxed italic text-slate-200">
                    {currentQuestion ? `"${currentQuestion}"` : 'Preparing your first question...'}
                  </p>
                </div>

                <button
                  onClick={finishAnswer}
                  className="w-full py-4 bg-brand-500 hover:bg-brand-600 rounded-2xl font-bold mt-6 transition-all flex items-center justify-center gap-3"
                >
                  <i className="fas fa-paper-plane"></i> {status === 'speaking' ? 'Start Answering' : status === 'processing' ? 'Processing...' : "I'm Done Answering"}
                </button>

                <button onClick={stopAndFeedback} className="w-full py-5 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 rounded-2xl font-bold mt-4 transition-all flex items-center justify-center gap-3">
                  <i className="fas fa-stop-circle"></i> End Session & Get Feedback
                </button>

                {isError && errorMessage && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-sm flex items-center gap-3">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              <div className="bg-navy-900/80 p-4 rounded-2xl border border-slate-700/50 flex flex-col h-[500px]">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 pb-2 border-b border-slate-700/50">Transcript</h3>
                <div ref={transcriptScrollRef} className="flex-grow overflow-y-auto custom-scrollbar space-y-4 pr-2">
                  {displayedTranscripts.map((t, i) => (
                    <div key={i} className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">{t.role === 'user' ? 'You' : 'Sarah'}</span>
                      <div className={`p-3 rounded-2xl text-xs max-w-[90%] ${t.role === 'user' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-300 rounded-tl-none'}`}>
                        {t.text}
                      </div>
                    </div>
                  ))}
                  {displayedTranscripts.length === 0 && <p className="text-center text-slate-600 text-xs mt-20">Transcript will appear here.</p>}
                </div>
              </div>
            </div>
          )}

          {stage === 'processing_feedback' && (
            <div className="h-[400px] flex flex-col items-center justify-center space-y-6">
              <i className="fas fa-brain text-5xl text-brand-500 animate-bounce"></i>
              <p className="text-brand-400 font-medium">Analyzing your performance...</p>
            </div>
          )}

          {stage === 'feedback' && feedback && (
            <div className="animate-fade-in-up space-y-8 print:text-black">
              <div className="text-center">
                <div className="inline-flex flex-col items-center">
                  <span className="text-7xl font-bold text-brand-500">{feedback.score}</span>
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-widest mt-2">Overall Quality Score</span>
                </div>
                <h2 className="text-2xl font-bold mt-4 print:block hidden">Interview Feedback: {jobRole}</h2>
                <p className="text-slate-300 mt-6 max-w-2xl mx-auto leading-relaxed print:text-black">{feedback.summary}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-500/5 p-6 rounded-3xl border border-green-500/20 print:bg-white print:border-green-200">
                  <h4 className="text-green-400 font-bold text-sm mb-4 flex items-center gap-2 print:text-green-700">
                    <i className="fas fa-check-circle"></i> Key Strengths
                  </h4>
                  <ul className="text-sm space-y-3">
                    {feedback.strengths.map((s, i) => <li key={i} className="flex gap-3 text-slate-300 print:text-black"><span className="text-green-500">-</span> {s}</li>)}
                  </ul>
                </div>
                <div className="bg-red-500/5 p-6 rounded-3xl border border-red-500/20 print:bg-white print:border-red-200">
                  <h4 className="text-red-400 font-bold text-sm mb-4 flex items-center gap-2 print:text-red-700">
                    <i className="fas fa-exclamation-circle"></i> Weaknesses
                  </h4>
                  <ul className="text-sm space-y-3">
                    {feedback.weaknesses.map((w, i) => <li key={i} className="flex gap-3 text-slate-300 print:text-black"><span className="text-red-500">-</span> {w}</li>)}
                  </ul>
                </div>
              </div>

              {feedback.lineFeedback && feedback.lineFeedback.length > 0 && (
                <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 print:bg-white print:border-slate-200">
                  <h4 className="text-brand-400 font-bold text-sm mb-4 flex items-center gap-2 print:text-brand-700">
                    <i className="fas fa-list-check"></i> Line-by-line Feedback
                  </h4>
                  <div className="space-y-4">
                    {feedback.lineFeedback.map((item, i) => (
                      <div key={i} className="bg-navy-900/50 p-4 rounded-xl border border-slate-700/50 print:bg-slate-50 print:text-black print:border-slate-200">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Your line</p>
                        <p className="text-sm text-slate-300 italic print:text-black">"{item.quote}"</p>
                        <p className="text-xs text-slate-500 font-bold uppercase mt-3 mb-1">Feedback</p>
                        <p className="text-sm text-slate-300 print:text-black">{item.feedback}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase mt-3 mb-1">Suggested answer</p>
                        <p className="text-sm text-slate-300 print:text-black">{item.improvedAnswer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-brand-500/5 p-8 rounded-3xl border border-brand-500/20 print:bg-white print:border-brand-200">
                <h4 className="text-brand-400 font-bold text-sm mb-4 flex items-center gap-2 print:text-brand-700">
                  <i className="fas fa-lightbulb"></i> Recommendations
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  {feedback.suggestions.map((s, i) => (
                    <div key={i} className="bg-navy-900/50 p-4 rounded-xl text-sm text-slate-300 border border-slate-700/50 print:bg-slate-50 print:text-black print:border-slate-200">
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              {feedback.suggestedAnswers && feedback.suggestedAnswers.length > 0 && (
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 print:bg-white print:border-slate-200">
                  <h4 className="text-brand-400 font-bold text-sm mb-4 flex items-center gap-2 print:text-brand-700">
                    <i className="fas fa-comment-dots"></i> Suggested Answers
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-300 print:text-black">
                    {feedback.suggestedAnswers.map((answer, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-brand-400 font-bold">{i + 1}.</span>
                        <span>{answer}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 print:hidden">
                <button onClick={() => { setStage('setup'); setTranscripts([]); setCurrentQuestion(''); }} className="flex-1 py-4 bg-brand-500 hover:bg-brand-600 rounded-xl font-bold transition-all">Start New Session</button>
                <button onClick={handleDownloadReport} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all">Download Report (PDF)</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LiveInterview;
