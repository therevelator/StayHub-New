import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import propertyOwnerService from '../../services/propertyOwnerService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsSection = ({ selectedProperty }) => {
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('6months');
  const [analytics, setAnalytics] = useState({
    bookingTrends: [],
    occupancyRates: [],
    revenueData: [],
    roomPerformance: []
  });

  useEffect(() => {
    if (selectedProperty) {
      fetchAnalytics();
    }
  }, [selectedProperty, timeframe]);

  const fetchAnalytics = async () => {
    if (!selectedProperty) return;
    
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = subMonths(
        startOfMonth(endDate),
        timeframe === '6months' ? 6 : 12
      );

      const response = await propertyOwnerService.getPropertyAnalytics(
        selectedProperty.id,
        format(startDate, 'yyyy-MM-dd'),
        format(endOfMonth(endDate), 'yyyy-MM-dd')
      );
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const bookingTrendsConfig = {
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Booking Trends'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    },
    data: {
      labels: analytics.bookingTrends.map(item => format(new Date(item.date), 'MMM yyyy')),
      datasets: [
        {
          label: 'Number of Bookings',
          data: analytics.bookingTrends.map(item => item.count),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    }
  };

  const occupancyRatesConfig = {
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Occupancy Rates'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: value => `${value}%`
          }
        }
      }
    },
    data: {
      labels: analytics.occupancyRates.map(item => format(new Date(item.date), 'MMM yyyy')),
      datasets: [
        {
          label: 'Occupancy Rate',
          data: analytics.occupancyRates.map(item => item.rate),
          backgroundColor: 'rgba(53, 162, 235, 0.5)'
        }
      ]
    }
  };

  const revenueConfig = {
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Monthly Revenue'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `$${value}`
          }
        }
      }
    },
    data: {
      labels: analytics.revenueData.map(item => format(new Date(item.date), 'MMM yyyy')),
      datasets: [
        {
          label: 'Revenue',
          data: analytics.revenueData.map(item => item.amount),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)'
        }
      ]
    }
  };

  const roomPerformanceConfig = {
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Room Performance'
        }
      }
    },
    data: {
      labels: analytics.roomPerformance.map(item => item.room_name),
      datasets: [
        {
          data: analytics.roomPerformance.map(item => item.bookings_count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
          ]
        }
      ]
    }
  };

  if (!selectedProperty) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">
          Please select a property to view analytics
        </h3>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              View performance metrics for {selectedProperty.name}
            </p>
          </div>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading analytics data...</div>
      ) : (
        <div className="space-y-6">
          {/* Booking Trends & Occupancy Rates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Line options={bookingTrendsConfig.options} data={bookingTrendsConfig.data} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Bar options={occupancyRatesConfig.options} data={occupancyRatesConfig.data} />
            </div>
          </div>

          {/* Revenue & Room Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Line options={revenueConfig.options} data={revenueConfig.data} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Doughnut options={roomPerformanceConfig.options} data={roomPerformanceConfig.data} />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Average Occupancy Rate</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {analytics.occupancyRates.length > 0
                    ? `${(
                        analytics.occupancyRates.reduce((sum, item) => sum + item.rate, 0) /
                        analytics.occupancyRates.length
                      ).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {analytics.bookingTrends.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Average Revenue per Booking</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  ${analytics.revenueData.length > 0 && analytics.bookingTrends.length > 0
                    ? (
                        analytics.revenueData.reduce((sum, item) => sum + item.amount, 0) /
                        analytics.bookingTrends.reduce((sum, item) => sum + item.count, 0)
                      ).toFixed(2)
                    : '0.00'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Best Performing Room</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {analytics.roomPerformance.length > 0
                    ? analytics.roomPerformance.reduce((best, current) =>
                        current.bookings_count > best.bookings_count ? current : best
                      ).room_name
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsSection; 