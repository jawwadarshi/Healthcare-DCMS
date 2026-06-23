import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  isLoading?: boolean;
}

export const DashboardCard = ({
  title,
  value,
  subtitle,
  icon,
  gradient,
  trend,
  isLoading = false,
}: DashboardCardProps) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full`}
    >
      {/* Gradient Header */}
      <div className={`${gradient} h-2`}></div>

      <div className="p-6">
        {/* Top Section - Icon and Title */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>

          {/* Icon */}
          <div
            className={`${gradient} bg-gradient-to-br rounded-lg p-3 text-white shadow-md`}
          >
            <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
          </div>
        </div>

        {/* Value Section */}
        <div className="mt-4">
          {isLoading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
              </div>

              {/* Trend */}
              {trend && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${trend.direction === 'up'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    }`}
                >
                  <span>
                    {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
