'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Settings, Moon, Sun, Globe, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useThemeStore } from '@/store/theme';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');

  const handleSaveTimezone = async () => {
    try {
      await api.updateProfile({ timezone });
      toast.success('Timezone updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
      <h1 className="text-h4 font-medium text-text-primary mb-8">Settings</h1>

      {/* Profile */}
      <Card className="p-6 mb-6">
        <h2 className="text-h6 font-medium text-text-primary mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-2xl font-medium text-accent">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-h6 text-text-primary">{user?.name}</p>
            <p className="text-sm text-text-muted">{user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6 mb-6">
        <h2 className="text-h6 font-medium text-text-primary mb-4">Preferences</h2>
        <div className="space-y-4">
          {/* Dark Mode */}
          <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={18} className="text-accent" /> : <Sun size={18} className="text-warning" />}
              <div>
                <p className="text-sm text-text-primary">Dark Mode</p>
                <p className="text-xs text-text-muted">{isDark ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
            <button
              onClick={toggle}
              className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-accent' : 'bg-dark-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isDark ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-info" />
              <div>
                <p className="text-sm text-text-primary">Timezone</p>
                <p className="text-xs text-text-muted">Auto-detected, can be overridden</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-dark-800 border border-dark-300 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {Intl.supportedValuesOf?.('timeZone')?.map((tz: string) => (
                  <option key={tz} value={tz}>{tz}</option>
                )) || (
                  <>
                    <option value="UTC">UTC</option>
                    <option value="Asia/Calcutta">Asia/Calcutta</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                  </>
                )}
              </select>
              <Button variant="primary" size="sm" onClick={handleSaveTimezone}>Save</Button>
            </div>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-warning" />
              <div>
                <p className="text-sm text-text-primary">Notifications</p>
                <p className="text-xs text-text-muted">Login notifications and task alerts</p>
              </div>
            </div>
            <span className="text-xs text-text-muted bg-dark-600 px-2 py-1 rounded-pill">Active ✅</span>
          </div>
        </div>
      </Card>

      {/* Streak Preferences */}
      <Card className="p-6">
        <h2 className="text-h6 font-medium text-text-primary mb-4">Streak Settings</h2>
        <p className="text-sm text-text-muted mb-4">
          Streaks track consecutive days of activity in your projects. Configure your preferences here.
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-accent" defaultChecked />
            <span className="text-sm text-text-primary">Freeze streaks on weekends</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-accent" defaultChecked />
            <span className="text-sm text-text-primary">Send daily reminder at 9:00 AM</span>
          </label>
        </div>
      </Card>
    </motion.div>
  );
}
