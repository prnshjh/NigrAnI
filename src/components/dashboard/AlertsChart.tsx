import { useMemo } from 'react';
import type { Alert } from '../../lib/types';

interface AlertsChartProps {
  alerts: Alert[];
  loading?: boolean;
}

export function AlertsChart({ alerts, loading }: AlertsChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const days = 7;
    const buckets: { date: string; high: number; medium: number; low: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        high: 0,
        medium: 0,
        low: 0,
      });
    }

    alerts.forEach((alert) => {
      const alertDate = new Date(alert.timestamp);
      const diffMs = now.getTime() - alertDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < days) {
        const idx = days - 1 - diffDays;
        if (alert.risk_level === 'high') buckets[idx].high++;
        else if (alert.risk_level === 'medium') buckets[idx].medium++;
        else buckets[idx].low++;
      }
    });

    return buckets;
  }, [alerts]);

  const maxVal = useMemo(() => {
    const max = Math.max(...chartData.map((b) => b.high + b.medium + b.low));
    return max === 0 ? 10 : max;
  }, [chartData]);

  const HEIGHT = 120;
  const BAR_WIDTH = 32;
  const GAP = 12;
  const totalWidth = chartData.length * (BAR_WIDTH + GAP) - GAP;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Alert Activity</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 7 days by severity</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
            <span className="text-gray-500">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-400"></div>
            <span className="text-gray-500">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></div>
            <span className="text-gray-500">Low</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-40 bg-gray-50 rounded-lg animate-pulse"></div>
      ) : (
        <div className="overflow-x-auto">
          <svg
            width={totalWidth}
            height={HEIGHT + 24}
            className="min-w-full"
            style={{ minWidth: `${totalWidth}px` }}
          >
            {chartData.map((bucket, i) => {
              const x = i * (BAR_WIDTH + GAP);
              const total = bucket.high + bucket.medium + bucket.low;
              const highH = (bucket.high / maxVal) * HEIGHT;
              const medH = (bucket.medium / maxVal) * HEIGHT;
              const lowH = (bucket.low / maxVal) * HEIGHT;
              const totalH = (total / maxVal) * HEIGHT;
              let yOffset = HEIGHT;

              return (
                <g key={bucket.date}>
                  {bucket.low > 0 && (() => {
                    yOffset -= lowH;
                    return <rect x={x} y={yOffset} width={BAR_WIDTH} height={lowH} rx={2} fill="#34d399" />;
                  })()}
                  {bucket.medium > 0 && (() => {
                    yOffset -= medH;
                    return <rect x={x} y={yOffset} width={BAR_WIDTH} height={medH} rx={2} fill="#fbbf24" />;
                  })()}
                  {bucket.high > 0 && (() => {
                    const y = HEIGHT - totalH;
                    return <rect x={x} y={y} width={BAR_WIDTH} height={highH} rx={2} fill="#ef4444" />;
                  })()}
                  {total === 0 && (
                    <rect x={x} y={HEIGHT - 2} width={BAR_WIDTH} height={2} rx={1} fill="#e5e7eb" />
                  )}
                  <text
                    x={x + BAR_WIDTH / 2}
                    y={HEIGHT + 16}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#9ca3af"
                  >
                    {bucket.date.split(',')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
