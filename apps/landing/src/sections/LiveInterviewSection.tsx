import React from 'react';
import { Mic, Play, Settings2, Languages, ArrowRight } from 'lucide-react';

const LiveInterviewSection: React.FC = () => {
  return (
    <section className="py-24 bg-gray-50 dark:bg-neutral-950 border-y border-gray-100 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            Practice your interview before the real one.
          </h2>
          <p className="text-lg text-gray-600 dark:text-neutral-400 mb-4 leading-relaxed">
            Speak in your language. Your choice.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 rounded-full text-sm font-medium border border-purple-100">
            <Mic className="w-4 h-4" /> Relax. There are no trick questions here. Just speak naturally.
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-10 bg-gradient-to-br from-purple-600 to-blue-700 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5Z29uIHBvaW50cz0iMjIgMyAyIDMgMTAgMTIuNDYgMTAgMTkgMTQgMjEgMTQgMTIuNDYgMjIgMyI+PC9wb2x5Z29uPjwvc3ZnPg==')] opacity-10 bg-[length:60px_60px]"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white dark:bg-neutral-900/20 rounded-full flex items-center justify-center backdrop-blur-sm mb-6">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Speech-to-Speech Mode</h3>
                <p className="text-purple-100 mb-8">AI interviewer will listen and speak back to you just like a real HR round.</p>
              </div>

              <div className="relative z-10">
                <button className="w-full bg-white dark:bg-neutral-900 text-purple-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 dark:bg-neutral-950 transition-colors shadow-lg flex items-center justify-center gap-2">
                  Create Account to Start Interview <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 md:p-10 space-y-6">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold mb-6">
                <Settings2 className="w-5 h-5 text-gray-500 dark:text-neutral-500" /> Interview Setup
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-200 mb-2 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-gray-400" /> Interview Language
                </label>
                <select className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-3">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Marathi</option>
                  <option>Tamil</option>
                  <option>Telugu</option>
                  <option>Bengali</option>
                  <option>Gujarati</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-neutral-500 mt-2">Use same language for results</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-200 mb-2">Difficulty</label>
                <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg">
                  <button className="flex-1 py-2 text-sm font-medium bg-white dark:bg-neutral-900 shadow-sm rounded-md text-gray-900 dark:text-white">Basic</button>
                  <button className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:text-white">Moderate</button>
                  <button className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:text-white">High</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-200 mb-2">Company & Role (Optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="e.g. TCS" className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-3" />
                  <input type="text" placeholder="e.g. Data Entry" className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveInterviewSection;
