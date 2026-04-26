import { Shield, AlertTriangle, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SecurityEvent } from '../../lib/types';

interface EventsTableProps {
  events: SecurityEvent[];
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  filterType: string;
  onFilterChange: (type: string) => void;
}

const EVENT_TYPES = ['ALL', 'LOITERING', 'INTRUSION', 'TAILGATING', 'CROWD_GATHERING', 'PERIMETER_BREACH', 'SUSPICIOUS_ACTIVITY', 'UNATTENDED_OBJECT'];

function getConfidenceBadge(confidence: number) {
  if (confidence >= 0.85) return 'bg-red-100 text-red-700';
  if (confidence >= 0.7) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-600';
}

function formatEventType(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const TYPE_ICONS: Record<string, typeof Shield> = {
  INTRUSION: Shield,
  PERIMETER_BREACH: Shield,
  default: AlertTriangle,
};

export function EventsTable({ events, loading, total, page, pageSize, onPageChange, filterType, onFilterChange }: EventsTableProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Event Log</h3>
          <p className="text-xs text-gray-500 mt-0.5">{total.toLocaleString()} total events</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onFilterChange(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type === 'ALL' ? 'All Types' : formatEventType(type)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camera</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No events found</p>
                </td>
              </tr>
            ) : (
              events.map((event) => {
                const Icon = TYPE_ICONS[event.event_type] ?? TYPE_ICONS.default;
                return (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{formatEventType(event.event_type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 font-mono text-xs">{event.camera_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{event.zone || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{event.duration}s</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getConfidenceBadge(event.confidence)}`}>
                        {Math.round(event.confidence * 100)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{formatDate(event.timestamp)}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    pageNum === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
