import React from 'react';
import { CheckCircleIcon, PauseCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const StatusItem = ({ icon, count, label, color }) => (
  <div className="flex items-center justify-between p-4 bg-${color}-50 rounded-lg">
    <div className="flex items-center">
      {icon}
      <span className="ml-2 text-${color}-700">{label}</span>
    </div>
    <span className="text-lg font-semibold text-${color}-700">{count}</span>
  </div>
);

const PropertyStatus = () => {
  // Mock data - replace with actual API call
  const stats = {
    active: 12,
    pending: 3,
    inactive: 2,
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Property Status</h2>
      
      <div className="grid grid-cols-1 gap-4">
        <StatusItem
          icon={<CheckCircleIcon className="h-6 w-6 text-green-500" />}
          count={stats.active}
          label="Active Properties"
          color="green"
        />
        <StatusItem
          icon={<PauseCircleIcon className="h-6 w-6 text-yellow-500" />}
          count={stats.pending}
          label="Pending Review"
          color="yellow"
        />
        <StatusItem
          icon={<XCircleIcon className="h-6 w-6 text-red-500" />}
          count={stats.inactive}
          label="Inactive Properties"
          color="red"
        />
      </div>
    </div>
  );
};

export default PropertyStatus;
