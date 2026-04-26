import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  unreadCount: number;
  headerTitle: string;
  headerSubtitle?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function Layout({
  children,
  currentPage,
  onNavigate,
  unreadCount,
  headerTitle,
  headerSubtitle,
  isRefreshing,
  onRefresh,
}: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} unreadCount={unreadCount} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={headerTitle}
          subtitle={headerSubtitle}
          unreadCount={unreadCount}
          onAlertsClick={() => onNavigate('alerts')}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
