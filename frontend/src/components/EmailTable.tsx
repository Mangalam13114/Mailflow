'use client';

import { Email } from '@/types';

interface EmailTableProps {
  emails: Email[];
  type: 'scheduled' | 'sent';
  loading: boolean;
  onCancel?: (id: string) => void;
}

export default function EmailTable({ emails, type, loading, onCancel }: EmailTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      SCHEDULED: 'status-scheduled',
      QUEUED: 'status-queued',
      SENDING: 'status-sending',
      SENT: 'status-sent',
      FAILED: 'status-failed',
      CANCELLED: 'status-cancelled',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-gray-500'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading emails...</span>
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No {type} emails
          </h3>
          <p className="text-gray-400">
            {type === 'scheduled' 
              ? 'Schedule some emails to see them here.' 
              : 'Sent emails will appear here.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                To
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                {type === 'scheduled' ? 'Scheduled For' : 'Sent At'}
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              {type === 'scheduled' && onCancel && (
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2a2a]">
            {emails.map((email) => (
              <tr key={email.id} className="hover:bg-[#222]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-white">{email.to}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-white line-clamp-1">{email.subject}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-400">
                    {formatDate(type === 'scheduled' ? email.scheduledAt : (email.sentAt || email.scheduledAt))}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(email.status)}
                </td>
                {type === 'scheduled' && onCancel && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {['SCHEDULED', 'QUEUED'].includes(email.status) && (
                      <button
                        onClick={() => onCancel(email.id)}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}