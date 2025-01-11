import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyOwnerService } from '../../services/propertyOwnerService';
import { toast } from 'react-hot-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { MaintenanceSection } from '../../components/OwnerDashboard/MaintenanceSection';
import { MessagesSection } from '../../components/OwnerDashboard/MessagesSection';
import { FinancesSection } from '../../components/OwnerDashboard/FinancesSection';
import { AnalyticsSection } from '../../components/OwnerDashboard/AnalyticsSection';
import { CalendarSection } from '../../components/OwnerDashboard/CalendarSection';

export const PropertyDashboard = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const response = await propertyOwnerService.getPropertyById(propertyId);
        setProperty(response.data.data);
      } catch (error) {
        console.error('Error fetching property details:', error);
        toast.error('Failed to fetch property details');
        navigate('/owner/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [propertyId, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!property) {
    return <div className="flex items-center justify-center min-h-screen">Property not found</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Property Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{property.name}</h1>
          <p className="text-gray-500">{property.address}</p>
        </div>
        <Button onClick={() => navigate('/owner/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {/* Property Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold">Rooms</h3>
          <p className="text-2xl">{property.rooms_count}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold">Active Bookings</h3>
          <p className="text-2xl">{property.active_bookings_count}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold">Maintenance Tasks</h3>
          <p className="text-2xl">{property.maintenance_count || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold">Unread Messages</h3>
          <p className="text-2xl">{property.unread_messages_count || 0}</p>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid grid-cols-6 gap-4">
          <TabsTrigger value="analytics" className="bg-white">Analytics</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsSection selectedProperty={property} />
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarSection selectedProperty={property} />
        </TabsContent>

        <TabsContent value="bookings">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Bookings</h2>
            {property.recent_bookings?.map((booking) => (
              <Card key={booking.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{booking.guest_name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.check_in_date).toLocaleDateString()} - 
                      {new Date(booking.check_out_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceSection selectedProperty={property} />
        </TabsContent>

        <TabsContent value="messages">
          <MessagesSection selectedProperty={property} />
        </TabsContent>

        <TabsContent value="finances">
          <FinancesSection selectedProperty={property} />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 