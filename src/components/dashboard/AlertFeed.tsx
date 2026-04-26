import { AlertTriangle, Info, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import type { Alert } from '../../lib/types';

interface AlertFeedProps {
  alerts: Alert[];
  loading?: boolean;
  onMarkRead: (id: string) => void;
  onViewAll: () => void;
  limit?: number;
}

const RISK_CONFIG = {
  high: { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', label: 'High Risk' },
  medium: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Medium Risk' },
  low: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Low Risk' },
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatEventType(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AlertFeed({ alerts, loading, onMarkRead, onViewAll, limit = 6 }: AlertFeedProps) {
  const displayAlerts = alerts.slice(0, limit);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Recent Alerts</h3>
          <p className="text-xs text-gray-500 mt-0.5">{alerts.filter((a) => !a.is_read).length} unread</p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View all
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse flex-shrink-0"></div>
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-gray-100 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ))
        ) : displayAlerts.length === 0 ? (
          <div className="px-6 py-10 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No alerts yet</p>
          </div>
        ) : (
          displayAlerts.map((alert) => {
            const config = RISK_CONFIG[alert.risk_level];
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className={`px-6 py-4 flex items-start gap-3 transition-colors ${!alert.is_read ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
              >
                <div className={`w-8 h-8 rounded-lg ${config.bg} ${config.border} border flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {formatEventType(alert.event_type)}
                    </p>
                    {!alert.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {alert.camera_name} &bull; {alert.zone} &bull; {Math.round(alert.confidence * 100)}% confidence
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {timeAgo(alert.timestamp)}
                    </span>
                  </div>
                </div>
                {!alert.is_read && (
                  <button
                    onClick={() => onMarkRead(alert.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-1"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
