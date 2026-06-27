import React, { useEffect, useState } from 'react';
import Card from '../../../../packages/shared/src/components/Card';
import ResumePreview from '../components/ResumePreview';
import { mockResumeData } from '../data/mockData';
import { COPY, getSupabaseClient } from '@nextstep/shared';
import Button from '../../../../packages/shared/src/components/Button';
import { Loader2 } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<{ full_name: string; email: string }>({ full_name: '', email: '' });
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let email = user.email || '';
        let fullName = '';

        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          fullName = profileData.full_name || '';
          setProfileExists(true);
        } else {
          fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
          setProfileExists(false);
        }

        setProfile({ full_name: fullName, email });
      } catch (error) {
        console.error('Error fetching profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cleanName = profile.full_name.trim();
      const query = profileExists
        ? supabase
            .from('user_profiles')
            .update({ full_name: cleanName, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
        : supabase
            .from('user_profiles')
            .insert({ user_id: user.id, full_name: cleanName });

      const { error } = await query;

      if (error) throw error;
      setProfile((current) => ({ ...current, full_name: cleanName }));
      setProfileExists(true);
      setMessage('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error saving profile', error);
      setMessage(error.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{COPY.PROFILE.headline}</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">{COPY.PROFILE.supportText}</p>
      </div>

      {/* Profile Card */}
      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-2xl font-bold flex items-center justify-center flex-shrink-0 uppercase">
              {profile.full_name ? profile.full_name.charAt(0) : profile.email?.charAt(0) || 'U'}
            </div>

            {/* Info Form */}
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {message && (
                <p className={`text-sm ${message.includes('successfully') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {message}
                </p>
              )}

              <div className="mt-6">
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
                  {COPY.PROFILE.ctaSave}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Referral Section */}
      <div className="mt-8">
        <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">{COPY.PROFILE.referralTitle}</h2>
          <p className="text-sm text-green-700 dark:text-green-400 mb-4">{COPY.PROFILE.referralDesc}</p>
          <Button variant="primary" className="bg-green-600 hover:bg-green-700 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2 inline-block">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            {COPY.PROFILE.whatsappBtn}
          </Button>
        </Card>
      </div>

      {/* Resume */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">My Resume</h2>
        <ResumePreview data={mockResumeData} />
      </div>
    </div>
  );
};

export default ProfilePage;
