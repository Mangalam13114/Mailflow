'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, emailAPI } from '@/services/api';
import { User, Email, QueueStats } from '@/types';
import Header from '@/components/Header';
import EmailTable from '@/components/EmailTable';
import ComposeModal from '@/components/ComposeModal';
import StatsCard from '@/components/StatsCard';
import toast, { Toaster } from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  
  // State
  const [user, setUser] = useState<User | null>(null);
  const [scheduledEmails, setScheduledEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        if (response.success) {
          setUser(response.data);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  // Fetch emails and stats
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [scheduledRes, sentRes, statsRes] = await Promise.all([
          emailAPI.getScheduledEmails(),
          emailAPI.getSentEmails(),
          emailAPI.getStats(),
        ]);

        if (scheduledRes.success) {
          setScheduledEmails(scheduledRes.data || []);
        }

        if (sentRes.success) {
          setSentEmails(sentRes.data || []);
        }

        if (statsRes.success) {
          setStats(statsRes.data?.queue || null);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh data every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle cancel email
  const handleCancelEmail = async (id: string) => {
    try {
      const result = await emailAPI.cancelEmail(id);
      if (result.success) {
        toast.success('Email cancelled');
        // Refresh scheduled emails
        const response = await emailAPI.getScheduledEmails();
        if (response.success) {
          setScheduledEmails(response.data || []);
        }
      } else {
        toast.error(result.error || 'Failed to cancel email');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel email');
    }
  };

  // Handle compose success
  const handleComposeSuccess = async () => {
    try {
      const [scheduledRes, statsRes] = await Promise.all([
        emailAPI.getScheduledEmails(),
        emailAPI.getStats(),
      ]);

      if (scheduledRes.success) {
        setScheduledEmails(scheduledRes.data || []);
      }

      if (statsRes.success) {
        setStats(statsRes.data?.queue || null);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };

  // Show loading while checking auth
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Toaster position="top-right" />
      
      {/* Header */}
      <Header user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Scheduled"
            value={stats?.delayed || 0}
            color="blue"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="In Queue"
            value={stats?.waiting || 0}
            color="yellow"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />
          <StatsCard
            title="Sent"
            value={stats?.completed || 0}
            color="green"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          />
          <StatsCard
            title="Failed"
            value={stats?.failed || 0}
            color="red"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'scheduled'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
              }`}
            >
              Scheduled ({scheduledEmails.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
              }`}
            >
              Sent ({sentEmails.length})
            </button>
          </div>

          {/* Compose Button */}
          <button
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Compose New Email
          </button>
        </div>

        {/* Email Table */}
        {activeTab === 'scheduled' ? (
          <EmailTable
            emails={scheduledEmails}
            type="scheduled"
            loading={loading}
            onCancel={handleCancelEmail}
          />
        ) : (
          <EmailTable
            emails={sentEmails}
            type="sent"
            loading={loading}
          />
        )}
      </main>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={handleComposeSuccess}
      />
    </div>
  );
}