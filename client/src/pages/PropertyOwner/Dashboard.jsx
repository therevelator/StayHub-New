import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { propertyOwnerService } from '../../services/propertyOwnerService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const Dashboard = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await propertyOwnerService.getMyProperties();
        setProperties(response.data || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Properties</h1>
        <Button asChild>
          <Link to="/owner/properties/new">Add New Property</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {properties.map((property) => (
          <Link key={property.id} to={`/owner/properties/${property.id}`}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{property.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">{property.address}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Rooms</p>
                    <p className="text-lg font-semibold">{property.rooms_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Bookings</p>
                    <p className="text-lg font-semibold">{property.active_bookings_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;