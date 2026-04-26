import { useEffect, useState, useCallback } from 'react';
import { Camera, ShieldAlert, Bell, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StatsCard } from '../components/dashboard/StatsCard';
import { AlertFeed } from '../components/dashboard/AlertFeed';
import { AlertsChart } from '../components/dashboard/AlertsChart';
import type { DashboardStats, Alert } from '../lib/types';

interface OverviewPageProps {
  onNavigate: (page: string) => void;
}

export function OverviewPage({ onNavigate }: OverviewPageProps) {
  const [stats, setStats] = useState<DashboardStats>({ totalCameras: 0, activeCameras: 0, alertsToday: 0, highRiskAlerts: 0, unreadAlerts: 0 });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [camerasRes, alertsRes, alertsTodayRes, highRiskRes, unreadRes] = await Promise.all([
      supabase.from('cameras').select('id, status'),
      supabase.from('alerts').select('*').order('timestamp', { ascending: false }).limit(50),
      supabase.from('alerts').select('id', { count: 'exact', head: true }).gte('timestamp', today.toISOString()),
      supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('risk_level', 'high').gte('timestamp', today.toISOString()),
      supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('is_read', false),
    ]);

    const cameras = camerasRes.data ?? [];
    setStats({
      totalCameras: cameras.length,
      activeCameras: cameras.filter((c) => c.status === 'active').length,
      alertsToday: alertsTodayRes.count ?? 0,
      highRiskAlerts: highRiskRes.count ?? 0,
      unreadAlerts: unreadRes.count ?? 0,
    });
    setAlerts((alertsRes.data ?? []) as Alert[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleMarkRead = async (id: string) => {
    await supabase.from('alerts').update({ is_read: true }).eq('id', id);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Live Monitoring</span>
        </div>
        <p className="text-gray-500 text-sm">Real-time security intelligence across all cameras and zones</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatsCard
          label="Total Cameras"
          value={stats.totalCameras}
          icon={Camera}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          loading={loading}
        />
        <StatsCard
          label="Active Cameras"
          value={stats.activeCameras}
          icon={Activity}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100"
          loading={loading}
        />
        <StatsCard
          label="Alerts Today"
          value={stats.alertsToday}
          icon={Bell}
          iconColor="text-amber-600"
          iconBg="bg-amber-100"
          loading={loading}
        />
        <StatsCard
          label="High Risk Today"
          value={stats.highRiskAlerts}
          icon={ShieldAlert}
          iconColor="text-red-600"
          iconBg="bg-red-100"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AlertsChart alerts={alerts} loading={loading} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            {[
              { label: 'ML Service', status: 'operational', color: 'bg-emerald-500' },
              { label: 'Event Ingestion', status: 'operational', color: 'bg-emerald-500' },
              { label: 'Alert Engine', status: 'operational', color: 'bg-emerald-500' },
              { label: 'Zone Detection', status: 'operational', color: 'bg-emerald-500' },
              { label: 'RTSP Streams', status: stats.activeCameras > 0 ? 'operational' : 'degraded', color: stats.activeCameras > 0 ? 'bg-emerald-500' : 'bg-amber-500' },
            ].map(({ label, status, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{label}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color}`}></div>
                  <span className="text-xs text-gray-500 capitalize">{status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-gray-700">Camera Uptime</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: stats.totalCameras > 0 ? `${(stats.activeCameras / stats.totalCameras) * 100}%` : '0%' }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {stats.totalCameras > 0 ? `${Math.round((stats.activeCameras / stats.totalCameras) * 100)}% active` : 'No cameras configured'}
            </p>
          </div>
        </div>

        <div className="xl:col-span-3">
          <AlertFeed
            alerts={alerts}
            loading={loading}
            onMarkRead={handleMarkRead}
            onViewAll={() => onNavigate('alerts')}
            limit={6}
          />
        </div>
      </div>
    </div>
  );
}
