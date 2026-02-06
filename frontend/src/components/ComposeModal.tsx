'use client';

import { useState } from 'react';
import { emailAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ComposeModal({ isOpen, onClose, onSuccess }: ComposeModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [csvEmails, setCsvEmails] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState(2000);
  const [loading, setLoading] = useState(false);

  // Get minimum datetime (now + 1 minute)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      
      // Parse emails from CSV/text
      const emails = text
        .split(/[\n,;]/) // Split by newline, comma, or semicolon
        .map(email => email.trim().toLowerCase())
        .filter(email => {
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        });

      // Remove duplicates
      const uniqueEmails = [...new Set(emails)];
      
      setCsvEmails(uniqueEmails);
      
      if (uniqueEmails.length > 0) {
        toast.success(`Found ${uniqueEmails.length} valid email addresses`);
      } else {
        toast.error('No valid email addresses found in file');
      }
    };
    
    reader.readAsText(file);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (csvEmails.length === 0) {
      toast.error('Please upload a CSV file with email addresses');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!body.trim()) {
      toast.error('Please enter email body');
      return;
    }

    if (!startTime) {
      toast.error('Please select a start time');
      return;
    }

    setLoading(true);

    try {
      // Create email array
      const emails = csvEmails.map(email => ({
        to: email,
        subject: subject.trim(),
        body: body.trim(),
      }));

      // Schedule emails
      const result = await emailAPI.scheduleEmails({
        emails,
        startTime: new Date(startTime).toISOString(),
        delayBetweenEmails,
      });

      if (result.success) {
        toast.success(`Successfully scheduled ${emails.length} emails!`);
        
        // Reset form
        setSubject('');
        setBody('');
        setCsvEmails([]);
        setStartTime('');
        setDelayBetweenEmails(2000);
        
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to schedule emails');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error('Failed to schedule emails');
    } finally {
      setLoading(false);
    }
  };

  // Clear emails list
  const handleClearEmails = () => {
    setCsvEmails([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-xl font-semibold text-white">Compose New Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* CSV Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Recipients (CSV/TXT file)
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-400">
                    Click to upload CSV or TXT file
                  </p>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </label>
            </div>
            
            {csvEmails.length > 0 && (
              <div className="mt-3 flex items-center justify-between bg-[#222] rounded-lg p-3">
                <span className="text-sm text-green-400">
                  ✓ {csvEmails.length} email addresses loaded
                </span>
                <button
                  type="button"
                  onClick={handleClearEmails}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full px-4 py-3 bg-[#222] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email content..."
              rows={6}
              className="w-full px-4 py-3 bg-[#222] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Schedule Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min={getMinDateTime()}
                className="w-full px-4 py-3 bg-[#222] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Delay Between Emails */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Delay Between Emails (seconds)
              </label>
              <input
                type="number"
                value={delayBetweenEmails / 1000}
                onChange={(e) => setDelayBetweenEmails(Number(e.target.value) * 1000)}
                min={1}
                max={60}
                className="w-full px-4 py-3 bg-[#222] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-300 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || csvEmails.length === 0}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scheduling...
                </span>
              ) : (
                `Schedule ${csvEmails.length} Emails`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}