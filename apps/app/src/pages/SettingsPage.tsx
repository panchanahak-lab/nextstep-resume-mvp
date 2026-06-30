import React, { useState } from 'react';
import Card from '../../../../packages/shared/src/components/Card';
import Button from '../../../../packages/shared/src/components/Button';
import { useTheme } from '@nextstep/shared';

const ToggleSwitch: React.FC<{ enabled: boolean; onToggle: () => void; label: string }> = ({ enabled, onToggle, label }) => (
  <div className="flex items-center justify-between py-3">
    <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [resumeTips, setResumeTips] = useState(false);
  const [profilePublic, setProfilePublic] = useState(true);
  const [showToRecruiters, setShowToRecruiters] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Appearance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Appearance</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Customize how NextStep Resume looks for you.</p>
        <div className="flex items-center justify-between py-3">
          <div>
            <span className="text-sm text-neutral-700 dark:text-neutral-300">Theme</span>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Currently using {theme} mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Switch to {theme === 'light' ? 'Dark' : 'Light'}
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Notifications</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Manage your notification preferences.</p>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          <ToggleSwitch label="Email notifications" enabled={emailNotifications} onToggle={() => setEmailNotifications(!emailNotifications)} />
          <ToggleSwitch label="Interview reminders" enabled={interviewReminders} onToggle={() => setInterviewReminders(!interviewReminders)} />
          <ToggleSwitch label="Resume tips" enabled={resumeTips} onToggle={() => setResumeTips(!resumeTips)} />
        </div>
      </Card>

      {/* Privacy */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Privacy</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Control your privacy settings.</p>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          <ToggleSwitch label="Profile visibility (public)" enabled={profilePublic} onToggle={() => setProfilePublic(!profilePublic)} />
          <ToggleSwitch label="Show resume to recruiters" enabled={showToRecruiters} onToggle={() => setShowToRecruiters(!showToRecruiters)} />
        </div>
      </Card>

      {/* Save */}
      <Button
        variant="primary"
        onClick={() => alert('TODO: Save settings to backend')}
      >
        Save Settings
      </Button>
    </div>
  );
};

export default SettingsPage;
