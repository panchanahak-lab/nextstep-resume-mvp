import React from 'react';
import { ThumbsUp, ThumbsDown, Lightbulb, RefreshCcw, Languages } from 'lucide-react';

const InterviewResultSection: React.FC = () => {
  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Interview Result</h2>
          <p className="text-gray-500">Review your performance and try again to improve.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 text-center border-b border-gray-100 bg-gray-50">
            <div className="inline-flex flex-col items-center justify-center w-32 h-32 rounded-full border-8 border-green-400 bg-white shadow-inner mb-4">
              <span className="text-4xl font-extrabold text-gray-900">72</span>
              <span className="text-sm font-bold text-gray-400">/100</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Good start! But you can do better.</h3>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                  <ThumbsUp className="w-5 h-5 text-green-500" /> What You Did Well
                </h4>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-sm text-green-900">
                  <p className="font-bold mb-1">Strongest Answer</p>
                  <p className="text-green-700 italic">"Tell me about a time you solved a problem."</p>
                  <p className="mt-2">You gave a clear example and explained the steps you took perfectly.</p>
                </div>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                  <ThumbsDown className="w-5 h-5 text-red-500" /> What to Improve
                </h4>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-sm text-red-900">
                  <p className="font-bold mb-1">Weakest Answer</p>
                  <p className="text-red-700 italic">"Why should we hire you?"</p>
                  <p className="mt-2">You hesitated a lot. Try to prepare a 2-3 sentence pitch about your skills.</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-500" /> Top 3 Improvement Tips
              </h4>
              <ul className="space-y-3 text-gray-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">1.</span> Speak slightly slower. Rushing makes you seem nervous.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">2.</span> Use the STAR method (Situation, Task, Action, Result) for behavioral questions.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">3.</span> Be more confident when talking about your past experience.
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
              <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                <RefreshCcw className="w-5 h-5" /> Practice Again
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-6 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                <Languages className="w-5 h-5" /> Switch Result Language
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InterviewResultSection;
