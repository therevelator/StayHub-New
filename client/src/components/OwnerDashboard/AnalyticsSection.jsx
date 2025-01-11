import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { propertyOwnerService } from '../../services/propertyOwnerService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AnalyticsSection = ({ selectedProperty }) => {
  const [analytics, setAnalytics] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [bookingData, setBookingData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [analyticsRes, revenueRes, bookingRes, occupancyRes] = await Promise.all([
          propertyOwnerService.getPropertyAnalytics(selectedProperty.id),
          propertyOwnerService.getRevenueAnalytics(selectedProperty.id),
          propertyOwnerService.getBookingAnalytics(selectedProperty.id),
          propertyOwnerService.getOccupancyAnalytics(selectedProperty.id)
        ]);

        setAnalytics(analyticsRes.data);
        setRevenueData(revenueRes.data);
        setBookingData(bookingRes.data);
        setOccupancyData(occupancyRes.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedProperty?.id) {
      fetchAnalytics();
    }
  }, [selectedProperty?.id]);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="flex items-center justify-center h-96">No analytics data available</div>;
  }

  const { 
    occupancy_rate,
    average_booking_value,
    total_revenue,
    occupancy_trend,
    revenue_trend,
    room_type_distribution,
    recent_bookings
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">Occupancy Rate</CardTitle>
            <CardDescription className="text-sm text-gray-500">Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">{occupancy_rate}%</div>
              <div className={`flex items-center ${occupancy_trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {occupancy_trend > 0 ? (
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm">{Math.abs(occupancy_trend)}% vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">Average Booking Value</CardTitle>
            <CardDescription className="text-sm text-gray-500">Per booking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">${average_booking_value}</div>
              <div className={`flex items-center ${revenue_trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                <ArrowUpIcon className="w-4 h-4 mr-1" />
                <span className="text-sm">{Math.abs(revenue_trend)}% increase</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">Total Revenue</CardTitle>
            <CardDescription className="text-sm text-gray-500">Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">${total_revenue}</div>
              <div className={`flex items-center ${revenue_trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                <ArrowUpIcon className="w-4 h-4 mr-1" />
                <span className="text-sm">{Math.abs(revenue_trend)}% growth</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-700">Revenue Trend</CardTitle>
            <CardDescription className="text-sm text-gray-500">Daily revenue from bookings</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Room Type Distribution */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-700">Room Type Distribution</CardTitle>
            <CardDescription className="text-sm text-gray-500">Bookings by room type</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={room_type_distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {room_type_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking Length Distribution */}
        <Card className="bg-white shadow-lg md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-700">Occupancy Trend</CardTitle>
            <CardDescription className="text-sm text-gray-500">Daily occupancy rate</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="occupancy_rate" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-700">Recent Bookings</CardTitle>
          <CardDescription className="text-sm text-gray-500">Latest booking activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recent_bookings?.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.guest_name}</div>
                      <div className="text-sm text-gray-500">{booking.guest_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.check_in_date).toLocaleDateString()} - 
                        {new Date(booking.check_out_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.room_name}</div>
                      <div className="text-sm text-gray-500">{booking.room_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${parseFloat(booking.total_price || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};