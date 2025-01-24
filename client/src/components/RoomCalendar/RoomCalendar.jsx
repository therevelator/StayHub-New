import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays, differenceInDays } from 'date-fns';
import api from '../../services/api';

const STATUS_COLORS = {
  available: 'bg-green-100 hover:bg-green-200',
  occupied: 'bg-red-100',
  maintenance: 'bg-amber-100',
  blocked: 'bg-red-100'
};

const STATUS_LABELS = {
  available: 'Available',
  occupied: 'Booked',
  maintenance: 'Maintenance',
  blocked: 'Blocked'
};

const RoomCalendar = ({ 
  roomId, 
  initialCheckIn, 
  initialCheckOut,
  onDateChange,
  isAdmin = false 
}) => {
  const [checkInDate, setCheckInDate] = useState(initialCheckIn || null);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOut || null);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalNights, setTotalNights] = useState(0);

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      fetchAvailability();
      const nights = differenceInDays(checkOutDate, checkInDate);
      setTotalNights(nights);
      onDateChange?.({ checkInDate, checkOutDate, nights });
    }
  }, [checkInDate, checkOutDate]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const startDate = format(checkInDate, 'yyyy-MM-dd');
      const endDate = format(checkOutDate, 'yyyy-MM-dd');
      
      console.log('Fetching availability for dates:', { startDate, endDate });
      
      const response = await api.get(`/properties/rooms/${roomId}/availability`, {
        params: { startDate, endDate }
      });
      
      setAvailability(response.data);
    } catch (err) {
      setError('Failed to fetch room availability');
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInChange = (date) => {
    setCheckInDate(date);
    // If check-out date exists and is before new check-in date, reset it
    if (checkOutDate && date >= checkOutDate) {
      setCheckOutDate(null);
    }
  };

  const handleCheckOutChange = (date) => {
    setCheckOutDate(date);
  };

  const isDateAvailable = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availability[dateStr]?.status === 'available';
  };

  if (loading && (checkInDate || checkOutDate)) {
    return <div>Checking availability...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check-in Date
          </label>
          <DatePicker
            selected={checkInDate}
            onChange={handleCheckInChange}
            selectsStart
            startDate={checkInDate}
            endDate={checkOutDate}
            minDate={new Date()}
            placeholderText="Select check-in date"
            className="w-full p-2 border rounded-md"
            dateFormat="MMM d, yyyy"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check-out Date
          </label>
          <DatePicker
            selected={checkOutDate}
            onChange={handleCheckOutChange}
            selectsEnd
            startDate={checkInDate}
            endDate={checkOutDate}
            minDate={checkInDate ? addDays(checkInDate, 1) : new Date()}
            placeholderText="Select check-out date"
            className="w-full p-2 border rounded-md"
            dateFormat="MMM d, yyyy"
            disabled={!checkInDate}
          />
        </div>
      </div>

      {totalNights > 0 && (
        <div className="text-sm text-gray-600">
          Total nights: {totalNights}
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      {!loading && checkInDate && checkOutDate && (
        <div className="mt-4 p-4 rounded-md border">
          <h3 className="font-medium mb-2">Availability Summary</h3>
          <div className="space-y-1">
            {Object.entries(availability).map(([date, status]) => (
              <div 
                key={date} 
                className={`text-sm p-2 rounded ${STATUS_COLORS[status.status] || 'bg-gray-100'}`}
              >
                {format(new Date(date), 'MMM d, yyyy')}: {STATUS_LABELS[status.status] || status.status}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center space-x-1">
            <div className={`w-4 h-4 rounded ${STATUS_COLORS[status]}`} />
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomCalendar; 