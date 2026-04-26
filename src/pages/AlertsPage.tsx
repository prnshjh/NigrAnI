import { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCheck, Clock, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Alert, RiskLevel } from '../lib/types';

const RISK_CONFIG = {
  high: { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', label: 'High Risk' },
  medium: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'Medium Risk' },
  low: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'Low Risk' },
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

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high' | 'medium' | 'low'>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchAlerts = useCallback(async () => {
    let query = supabase.from('alerts').select('*').order('timestamp', { ascending: false }).limit(200);
    if (filter === 'unread') query = query.eq('is_read', false);
    else if (filter === 'high' || filter === 'medium' || filter === 'low') query = query.eq('risk_level', filter);
    const { data } = await query;
    setAlerts((data ?? []) as Alert[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  useEffect(() => {
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleMarkRead = async (id: string) => {
    await supabase.from('alerts').update({ is_read: true }).eq('id', id);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a));
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await supabase.from('alerts').update({ is_read: true }).eq('is_read', false);
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    setMarkingAll(false);
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['all', 'unread', 'high', 'medium', 'low'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'unread' && unreadCount > 0 ? `Unread (${unreadCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3"></div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-900">No alerts found</p>
          <p className="text-sm text-gray-500 mt-1">Alerts will appear here when security events are detected</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const config = RISK_CONFIG[alert.risk_level as RiskLevel];
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border transition-colors ${!alert.is_read ? `${config.border} ${config.bg}` : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="p-5 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">{formatEventType(alert.event_type)}</h4>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badge}`}>{config.label}</span>
                      {!alert.is_read && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">New</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{alert.camera_name}</span>
                      <span>&bull;</span>
                      <span>Zone: {alert.zone}</span>
                      <span>&bull;</span>
                      <span>Confidence: {Math.round(alert.confidence * 100)}%</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                  {!alert.is_read && (
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      className="flex-shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors py-1 px-2 rounded-lg hover:bg-blue-50"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
