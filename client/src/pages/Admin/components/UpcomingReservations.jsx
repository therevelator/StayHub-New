import React from 'react';
import { format } from 'date-fns';

const ReservationItem = ({ reservation }) => (
  <div className="border-b border-gray-200 last:border-b-0 py-4">
    <div className="flex justify-between items-start mb-2">
      <div>
        <h3 className="text-sm font-medium text-gray-900">{reservation.guestName}</h3>
        <p className="text-sm text-gray-500">{reservation.propertyName}</p>
      </div>
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        reservation.status === 'confirmed'
          ? 'bg-green-100 text-green-800'
          : reservation.status === 'pending'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
      </span>
    </div>
    <div className="flex justify-between text-sm text-gray-500">
      <span>{format(new Date(reservation.checkIn), 'MMM d, yyyy')} - {format(new Date(reservation.checkOut), 'MMM d, yyyy')}</span>
    </div>
  </div>
);

const UpcomingReservations = () => {
  // This would be fetched from your API
  const reservations = [
    {
      id: 1,
      guestName: 'John Doe',
      propertyName: 'Seaside Villa',
      checkIn: '2024-12-20',
      checkOut: '2024-12-25',
      status: 'confirmed'
    },
    {
      id: 2,
      guestName: 'Jane Smith',
      propertyName: 'Mountain Cabin',
      checkIn: '2024-12-22',
      checkOut: '2024-12-27',
      status: 'pending'
    },
    {
      id: 3,
      guestName: 'Mike Johnson',
      propertyName: 'City Apartment',
      checkIn: '2024-12-23',
      checkOut: '2024-12-28',
      status: 'confirmed'
    }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Upcoming Reservations</h2>
      
      <div className="divide-y divide-gray-200">
        {reservations.map(reservation => (
          <ReservationItem key={reservation.id} reservation={reservation} />
        ))}
      </div>
      
      {reservations.length === 0 && (
        <p className="text-center text-gray-500 py-4">No upcoming reservations</p>
      )}
    </div>
  );
};

export default UpcomingReservations;
