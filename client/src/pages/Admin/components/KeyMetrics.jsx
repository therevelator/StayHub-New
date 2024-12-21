import React from 'react';
import { EyeIcon, CalendarDaysIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const MetricCard = ({ icon, label, value, trend }) => (
  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
    <div className="flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
    {trend && (
      <p className={`text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
        {trend > 0 ? '+' : ''}{trend}%
      </p>
    )}
  </div>
);

const KeyMetrics = () => {
  // This would be fetched from your API
  const metrics = {
    views: {
      value: '2.4k',
      trend: 12
    },
    bookings: {
      value: '156',
      trend: 8
    },
    revenue: {
      value: '$12.5k',
      trend: 15
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Key Metrics</h2>
      
      <div className="grid grid-cols-1 gap-4">
        <MetricCard
          icon={<EyeIcon className="h-6 w-6 text-blue-500" />}
          label="Total Views"
          value={metrics.views.value}
          trend={metrics.views.trend}
        />
        <MetricCard
          icon={<CalendarDaysIcon className="h-6 w-6 text-green-500" />}
          label="Total Bookings"
          value={metrics.bookings.value}
          trend={metrics.bookings.trend}
        />
        <MetricCard
          icon={<CurrencyDollarIcon className="h-6 w-6 text-yellow-500" />}
          label="Total Revenue"
          value={metrics.revenue.value}
          trend={metrics.revenue.trend}
        />
      </div>
    </div>
  );
};

export default KeyMetrics;
