import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { CamerasPage } from './pages/CamerasPage';
import { EventsPage } from './pages/EventsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Overview', subtitle: 'Real-time security intelligence dashboard' },
  cameras: { title: 'Camera Management', subtitle: 'Manage cameras, streams, and detection zones' },
  events: { title: 'Event Log', subtitle: 'All security events from ML service' },
  alerts: { title: 'Alert Center', subtitle: 'Threat alerts and notifications' },
  settings: { title: 'Settings', subtitle: 'Platform configuration and integrations' },
};

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState('overview');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [session, refreshKey]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 600));
    setIsRefreshing(false);
  };

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  const meta = PAGE_META[currentPage] ?? PAGE_META.overview;

  const renderPage = () => {
    switch (currentPage) {
      case 'overview': return <OverviewPage key={refreshKey} onNavigate={setCurrentPage} />;
      case 'cameras': return <CamerasPage key={refreshKey} />;
      case 'events': return <EventsPage key={refreshKey} />;
      case 'alerts': return <AlertsPage key={refreshKey} />;
      case 'settings': return <SettingsPage />;
      default: return <OverviewPage key={refreshKey} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      unreadCount={unreadCount}
      headerTitle={meta.title}
      headerSubtitle={meta.subtitle}
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
    >
      {renderPage()}
    </Layout>
  );
}
