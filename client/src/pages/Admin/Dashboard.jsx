import React from 'react';
import PropertyStatus from './components/PropertyStatus';
import KeyMetrics from './components/KeyMetrics';
import UpcomingReservations from './components/UpcomingReservations';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <PropertyStatus />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <KeyMetrics />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <UpcomingReservations />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
