import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const AnalyticsSection = ({ selectedProperty }) => {
  // Calculate analytics metrics
  const calculateOccupancyRate = () => {
    if (!selectedProperty.recent_bookings?.length) return 0;
    const totalDays = 30; // Last 30 days
    const bookedDays = selectedProperty.recent_bookings.reduce((acc, booking) => {
      const start = new Date(booking.check_in_date);
      const end = new Date(booking.check_out_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return acc + days;
    }, 0);
    return Math.round((bookedDays / totalDays) * 100);
  };

  const calculateAverageBookingValue = () => {
    if (!selectedProperty.recent_bookings?.length) return 0;
    const totalValue = selectedProperty.recent_bookings.reduce((acc, booking) => {
      return acc + parseFloat(booking.total_price || 0);
    }, 0);
    return (totalValue / selectedProperty.recent_bookings.length).toFixed(2);
  };

  const calculateTotalRevenue = () => {
    if (!selectedProperty.recent_bookings?.length) return 0;
    return selectedProperty.recent_bookings.reduce((acc, booking) => {
      return acc + parseFloat(booking.total_price || 0);
    }, 0).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{calculateOccupancyRate()}%</div>
            <p className="text-sm text-gray-500">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Booking Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${calculateAverageBookingValue()}</div>
            <p className="text-sm text-gray-500">Per booking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${calculateTotalRevenue()}</div>
            <p className="text-sm text-gray-500">From recent bookings</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedProperty.recent_bookings?.map((booking) => (
              <div key={booking.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{booking.guest_name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(booking.check_in_date).toLocaleDateString()} - 
                    {new Date(booking.check_out_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${parseFloat(booking.total_price || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{booking.room_name}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 