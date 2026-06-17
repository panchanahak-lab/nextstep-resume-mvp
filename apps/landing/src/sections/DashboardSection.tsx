import React from 'react';
import { FileText, ScanSearch, UserSquare2, UploadCloud, ChevronRight, Activity } from 'lucide-react';
import { APP_ROUTES } from '@nextstep/shared';
import { useAuthActions } from '../context/AuthActionContext';

const DashboardSection: React.FC = () => {
  const { goToProtectedRoute } = useAuthActions();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Welcome back, User!</h1>
          <p className="text-gray-600">Your career readiness at a glance.</p>
        </div>
        <button
          onClick={() => goToProtectedRoute(APP_ROUTES.dashboard, 'signup')}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm self-start md:self-end"
        >
          Upgrade to Pro
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-gray-600 font-medium">
            <FileText className="w-5 h-5 text-blue-500" /> Saved Resumes
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">0</div>
          <p className="text-sm text-gray-500 mt-auto">Create your first resume</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-gray-600 font-medium">
            <ScanSearch className="w-5 h-5 text-green-500" /> ATS Scans
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">0</div>
          <p className="text-sm text-gray-500 mt-auto">Upload to scan</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-gray-600 font-medium">
            <UserSquare2 className="w-5 h-5 text-purple-500" /> Interviews
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">0</div>
          <p className="text-sm text-gray-500 mt-auto">Practice today</p>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-sm border border-gray-700 flex flex-col text-white">
          <div className="flex items-center gap-3 mb-4 font-medium text-gray-300">
            <Activity className="w-5 h-5 text-yellow-400" /> Progress Summary
          </div>
          <div className="text-lg font-bold mb-1">No activity yet.</div>
          <p className="text-sm text-gray-400 mt-auto">Start by creating or uploading your resume.</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => goToProtectedRoute(APP_ROUTES.builder)}
          className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900">Create Resume</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
        </button>

        <button
          onClick={() => goToProtectedRoute(APP_ROUTES.scanner)}
          className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900">Upload Resume</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors" />
        </button>

        <button
          onClick={() => goToProtectedRoute(APP_ROUTES.scanner)}
          className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-yellow-300 hover:shadow-md transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <ScanSearch className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900">Scan Resume</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-yellow-500 transition-colors" />
        </button>

        <button
          onClick={() => goToProtectedRoute(APP_ROUTES.interview)}
          className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserSquare2 className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900">Start Interview</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
        </button>
      </div>
    </div>
  );
};

export default DashboardSection;
