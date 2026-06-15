import React, { useState } from 'react';
import { fetchAdminDashboard, runAdminAction } from '../lib/aiClient';

const packageOptions = [
  { id: 'resume_pack_29', label: 'Resume Pack' },
  { id: 'interview_pack_29', label: 'Interview Pack' },
  { id: 'job_ready_pack_49', label: 'Get Job Ready Pack' },
];

const AdminPanel: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [packageId, setPackageId] = useState(packageOptions[0].id);
  const [message, setMessage] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setMessage('');
    try {
      const dashboard = await fetchAdminDashboard();
      setData(dashboard);
    } catch (error: any) {
      setMessage(error.message || 'Admin access required.');
    } finally {
      setLoading(false);
    }
  };

  const action = async (actionName: string) => {
    if (!targetUserId) {
      setMessage('Enter a target user ID first.');
      return;
    }
    setLoading(true);
    try {
      await runAdminAction({ action: actionName, targetUserId, packageId });
      setMessage('Admin action completed.');
      await loadDashboard();
    } catch (error: any) {
      setMessage(error.message || 'Admin action failed.');
      setLoading(false);
    }
  };

  const counts = data?.counts ?? {};

  return (
    <section id="admin" className="py-20 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <span className="text-brand-500 font-semibold tracking-wide uppercase text-sm">Secure Admin</span>
            <h2 className="font-heading text-3xl font-bold text-navy-900 mt-2">Operations Panel</h2>
            <p className="text-slate-600 mt-2">Admin-only analytics, package access controls, usage logs, and test feature access.</p>
          </div>
          <button onClick={loadDashboard} disabled={loading} className="bg-navy-900 text-white px-5 py-3 rounded-lg font-bold disabled:opacity-60">
            {loading ? 'Loading...' : 'Load Admin Data'}
          </button>
        </div>

        {message && <div className="mb-6 bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700">{message}</div>}

        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                ['Users', counts.users],
                ['Resumes', counts.resumes],
                ['ATS', counts.atsReports],
                ['Interviews', counts.interviews],
                ['Usage', counts.usageEvents],
                ['Errors', counts.errors],
                ['Payments', counts.payments],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="text-xs uppercase text-slate-500 font-bold">{label}</div>
                  <div className="text-2xl font-bold text-navy-900 mt-1">{String(value ?? 0)}</div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-navy-900 mb-4">Grant / Revoke Package Access</h3>
              <div className="grid md:grid-cols-[1fr_220px_auto_auto] gap-3">
                <input value={targetUserId} onChange={e => setTargetUserId(e.target.value)} placeholder="Target user UUID" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                <select value={packageId} onChange={e => setPackageId(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  {packageOptions.map(pack => <option key={pack.id} value={pack.id}>{pack.label}</option>)}
                </select>
                <button onClick={() => action('grant-package')} className="bg-brand-500 text-white px-4 py-2 rounded-lg font-bold text-sm">Grant</button>
                <button onClick={() => action('revoke-package')} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-sm">Revoke</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="#ats-checker" className="text-sm font-bold text-brand-600">Test ATS scans</a>
                <a href="#interview" className="text-sm font-bold text-brand-600">Test interviews</a>
                <a href="#builder" className="text-sm font-bold text-brand-600">Test PDF generation</a>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <LogTable title="AI Usage Logs" rows={data.usage} columns={['feature', 'model', 'request_units', 'created_at']} />
              <LogTable title="Error Logs" rows={data.errors} columns={['source', 'message', 'created_at']} />
              <LogTable title="ATS Analytics" rows={data.atsReports} columns={['resume_name', 'overall_score', 'readiness_score', 'created_at']} />
              <LogTable title="Interview Analytics" rows={data.interviews} columns={['status', 'duration_seconds', 'started_at']} />
              <LogTable title="Resume Analytics" rows={data.resumes} columns={['title', 'ats_score', 'updated_at']} />
              <LogTable title="Payment Analytics" rows={data.payments} columns={['package_id', 'amount_inr', 'status', 'created_at']} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const LogTable: React.FC<{ title: string; rows: any[]; columns: string[] }> = ({ title, rows = [], columns }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 overflow-hidden">
    <h3 className="font-bold text-navy-900 mb-3">{title}</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-slate-500 border-b">
            {columns.map(col => <th key={col} className="py-2 pr-3 font-bold uppercase">{col.replace(/_/g, ' ')}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((row, index) => (
            <tr key={row.id ?? index} className="border-b border-slate-100">
              {columns.map(col => <td key={col} className="py-2 pr-3 max-w-[220px] truncate">{String(row[col] ?? '-')}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="py-4 text-slate-400" colSpan={columns.length}>No records yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminPanel;
