import React from 'react';
import { UploadCloud } from 'lucide-react';

const UploadResumeSection: React.FC = () => {
  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-blue-50 rounded-3xl p-8 md:p-16 border border-blue-100">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <UploadCloud className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Already have a resume? Upload it. We will fix it in 60 seconds.
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            We will find weak areas, improve the language, and make it job-ready.
          </p>
          
          <div className="flex flex-col items-center gap-4">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 w-full sm:w-auto">
              Upload Resume
            </button>
            <p className="text-sm text-gray-500 font-medium">
              PDF and DOCX supported.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UploadResumeSection;
