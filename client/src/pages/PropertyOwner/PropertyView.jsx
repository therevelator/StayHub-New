import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import propertyService from '../../services/propertyService';
import { propertyOwnerService } from '../../services/propertyOwnerService';
import { Tab } from '@headlessui/react';
import Swal from 'sweetalert2';
import RoomsList from '../Admin/EditProperty/components/RoomsList';
import { toast } from 'react-hot-toast';
import { AnalyticsSection } from '../../components/OwnerDashboard/AnalyticsSection';
import PropertyBookings from './PropertyBookings';

const PropertyView = () => {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [bookings, setBookings] = useState([]);

  const fetchData = async () => {
    try {
      const [propertyData, transactionsData, messagesData, bookingsData] = await Promise.all([
        propertyService.getById(propertyId),
        propertyOwnerService.getPropertyTransactions(propertyId),
        propertyOwnerService.getUnreadCount(), // This will be replaced with actual messages
        propertyOwnerService.getPropertyBookings(propertyId),
      ]);

      console.log('Property data:', propertyData);
      console.log('Transactions data:', transactionsData);
      console.log('Bookings data:', bookingsData);
      
      setProperty(propertyData);
      setTransactions(Array.isArray(transactionsData?.data) ? transactionsData.data : []);
      setMessages(Array.isArray(messagesData) ? messagesData : []);
      setBookings(Array.isArray(bookingsData?.data) ? bookingsData.data : []);
    } catch (error) {
      console.error('Error fetching property data:', error);
      setTransactions([]);
      setMessages([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  // Calculate financial metrics safely
  const calculateTotalRevenue = () => {
    if (!Array.isArray(bookings)) return 0;
    const pastAndOngoingBookings = bookings.filter(booking => {
      const checkOutDate = new Date(booking.check_out_date);
      const now = new Date();
      // Include bookings that are either past or ongoing
      return (checkOutDate <= now || new Date(booking.check_in_date) <= now) && booking.status === 'confirmed';
    });
    return pastAndOngoingBookings.reduce((sum, booking) => sum + (Number(booking.total_price) || 0), 0).toFixed(2);
  };

  const calculatePendingPayments = () => {
    if (!Array.isArray(bookings)) return 0;
    const upcomingBookings = bookings.filter(booking => {
      const checkInDate = new Date(booking.check_in_date);
      const now = new Date();
      // Only include future bookings that haven't started yet
      return checkInDate > now && booking.status === 'confirmed';
    });
    return upcomingBookings.reduce((sum, booking) => sum + (Number(booking.total_price) || 0), 0).toFixed(2);
  };

  const calculateAverageDailyRate = () => {
    if (!property?.rooms || !Array.isArray(property.rooms) || property.rooms.length === 0) return 0;
    const totalPrice = property.rooms.reduce((sum, r) => sum + (Number(r?.base_price || r?.price) || 0), 0);
    return (totalPrice / property.rooms.length).toFixed(2);
  };

  // Analytics calculations
  const calculateOccupancyRate = () => {
    if (!Array.isArray(bookings) || bookings.length === 0) return 0;
    
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const totalDays = confirmedBookings.reduce((sum, booking) => {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      return sum + Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    }, 0);

    const totalRoomDays = property.rooms.length * 30; // Last 30 days
    return Math.round((totalDays / totalRoomDays) * 100);
  };

  const calculateAverageLengthOfStay = () => {
    if (!Array.isArray(bookings) || bookings.length === 0) return 0;
    
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const totalDays = confirmedBookings.reduce((sum, booking) => {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      return sum + Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    }, 0);

    return Math.round(totalDays / confirmedBookings.length);
  };

  const calculateBookingConversionRate = () => {
    if (!Array.isArray(bookings) || bookings.length === 0) return 0;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    return Math.round((confirmedBookings / bookings.length) * 100);
  };

  const calculateRevenuePerRoom = () => {
    if (!Array.isArray(bookings) || bookings.length === 0 || !property.rooms) return 0;
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
    return Math.round(totalRevenue / property.rooms.length);
  };

  const calculateBookingDistribution = () => {
    if (!Array.isArray(bookings) || bookings.length === 0) return [];
    
    const distribution = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / bookings.length) * 100)
    }));
  };

  const calculateRoomTypePerformance = () => {
    if (!Array.isArray(bookings) || bookings.length === 0) return [];
    
    const performance = bookings.reduce((acc, booking) => {
      const roomType = booking.room_type || 'Unknown';
      if (!acc[roomType]) {
        acc[roomType] = { bookings: 0, revenue: 0 };
      }
      acc[roomType].bookings++;
      acc[roomType].revenue += Number(booking.total_price) || 0;
      return acc;
    }, {});

    return Object.entries(performance).map(([type, data]) => ({
      type,
      bookings: data.bookings,
      revenue: Math.round(data.revenue)
    }));
  };

  const calculateMonthlyRevenue = () => {
    if (!Array.isArray(bookings) || bookings.length === 0) return [];
    
    const monthlyData = bookings.reduce((acc, booking) => {
      const month = new Date(booking.check_in_date).toLocaleString('default', { month: 'short' });
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += Number(booking.total_price) || 0;
      return acc;
    }, {});

    return Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue)
    }));
  };

  const calculateMaxMonthlyRevenue = () => {
    const monthlyRevenue = calculateMonthlyRevenue();
    return Math.max(...monthlyRevenue.map(m => m.revenue), 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!property) {
    return <div className="flex justify-center items-center min-h-screen">Property not found</div>;
  }

  const handleRoomSubmit = async (roomData) => {
    try {
      if (roomData.id) {
        await propertyService.updateRoom(propertyId, roomData.id, roomData);
      } else {
        await propertyService.createRoom(propertyId, roomData);
      }
      await fetchData(); // Refresh property data
      toast.success(`Room ${roomData.id ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error(error.response?.data?.message || 'Failed to save room');
    }
  };

  const handleRoomDelete = async (roomId) => {
    try {
      const result = await Swal.fire({
        title: 'Delete Room',
        text: 'Are you sure you want to delete this room?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) {
        return;
      }

      await propertyService.deleteRoom(propertyId, roomId);
      await fetchData(); // Refresh property data
      
      await Swal.fire({
        icon: 'success',
        title: 'Room Deleted',
        text: 'Room has been deleted successfully',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error deleting room:', error);
      
      await Swal.fire({
        icon: 'error',
        title: 'Cannot Delete Room',
        text: error.response?.data?.message || 'Failed to delete room',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Property Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="p-6 border-b">
          <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
          <p className="mt-2 text-gray-600">{property.address}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
            ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`
          }>Overview</Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
            ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`
          }>Rooms</Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
            ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`
          }>Bookings</Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
            ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`
          }>Financials</Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
            ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`
          }>Analytics</Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
            ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`
          }>Messages</Tab>
        </Tab.List>

        <Tab.Panels>
          {/* Overview Panel */}
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Property Information</h2>
                  <div className="space-y-3">
                    <p><span className="font-medium">Type:</span> {property.type}</p>
                    <p><span className="font-medium">Description:</span> {property.description}</p>
                    <p><span className="font-medium">Status:</span> {property.status}</p>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-4">Statistics</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Rooms</p>
                      <p className="text-2xl font-bold">{property.rooms?.length || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Active Bookings</p>
                      <p className="text-2xl font-bold">{bookings.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Rooms Panel */}
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <RoomsList
                  propertyId={propertyId}
                  rooms={property.rooms || []}
                  onRoomSubmit={handleRoomSubmit}
                  onRoomDelete={handleRoomDelete}
                />
              </div>
            </div>
          </Tab.Panel>

          {/* Bookings Panel */}
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <PropertyBookings />
            </div>
          </Tab.Panel>

          {/* Financials Panel */}
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Financial Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Past & Ongoing Revenue</p>
                    <p className="text-2xl font-bold text-green-700">
                      ${calculateTotalRevenue()}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Future Bookings Revenue</p>
                    <p className="text-2xl font-bold text-blue-700">
                      ${calculatePendingPayments()}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Average Room Rate</p>
                    <p className="text-2xl font-bold text-purple-700">
                      ${calculateAverageDailyRate()}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction) => (
                          <tr key={transaction._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(transaction.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">{transaction.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{transaction.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                ${transaction.amount}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'}`}>
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Analytics Panel */}
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <AnalyticsSection selectedProperty={property} />
              </div>
            </div>
          </Tab.Panel>

          {/* Messages Panel */}
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Messages</h2>
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center">No messages found</p>
                  ) : (
                    messages.map((message) => (
                      <div key={message._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{message.sender_name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(message.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {!message.read && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default PropertyView; 