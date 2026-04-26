import { Video as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  trend?: { value: number; label: string; positive: boolean };
  loading?: boolean;
}

export function StatsCard({ label, value, icon: Icon, iconColor, iconBg, trend, loading }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 bg-gray-100 rounded animate-pulse w-16"></div>
      ) : (
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      )}
      {trend && !loading && (
        <div className="mt-2 flex items-center gap-1">
          <span className={`text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-gray-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
