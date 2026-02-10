// @AI-HINT: Settings page placeholder - redirects to portal-specific settings
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Settings as SettingsIcon, User, Shield, Bell, Palette } from 'lucide-react';

const Settings: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const settingsSections = [
    { icon: <User size={20} />, title: 'Profile Settings', desc: 'Manage your personal information', path: '/client/profile' },
    { icon: <Shield size={20} />, title: 'Security', desc: 'Password and authentication settings', path: '/client/dashboard' },
    { icon: <Bell size={20} />, title: 'Notifications', desc: 'Email and push notification preferences', path: '/client/dashboard' },
    { icon: <Palette size={20} />, title: 'Appearance', desc: 'Theme and display settings', path: '/client/dashboard' },
  ];

  return (
    <div>
      <div>
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon size={28} className={resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} />
          <h1 className={`text-2xl md:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Settings
          </h1>
        </div>

        <div className="grid gap-4">
          {settingsSections.map((section, idx) => (
            <button
              key={idx}
              onClick={() => router.push(section.path)}
              className={`w-full p-5 rounded-xl text-left transition-all ${
                resolvedTheme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${resolvedTheme === 'dark' ? 'bg-primary-600/20 text-primary-400' : 'bg-primary-50 text-primary-600'}`}>
                  {section.icon}
                </div>
                <div>
                  <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {section.title}
                  </h3>
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {section.desc}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
