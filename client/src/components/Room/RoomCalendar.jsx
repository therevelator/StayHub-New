import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import propertyService from '../../services/propertyService';
import { toast } from 'react-hot-toast';

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const RoomCalendar = ({ propertyId, room, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [price, setPrice] = useState(room?.price_per_night || 0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState({});
  const [defaultPrice, setDefaultPrice] = useState(room?.price_per_night || 0);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    if (propertyId && room?.id) {
      fetchRoomAvailability();
      fetchRoomReservations();
    }
  }, [propertyId, room?.id]);

  const fetchRoomAvailability = async () => {
    try {
      const response = await propertyService.getRoomAvailability(propertyId, room.id);
      setDefaultPrice(response.data.default_price);
      setAvailability(response.data.availability || {});
    } catch (error) {
      console.error('Error fetching room availability:', error);
      setAvailability({});
    }
  };

  const fetchRoomReservations = async () => {
    try {
      const response = await propertyService.getRoomReservations(propertyId, room.id);
      setReservations(response.data || []);
    } catch (error) {
      console.error('Error fetching room reservations:', error);
      setReservations([]);
    }
  };

  const getDaysInMonth = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleDateSelect = (date) => {
    if (isDateReserved(date)) {
      toast.error('Cannot modify reserved dates');
      return;
    }
    setSelectedDate(date);
    const dateKey = format(date, 'yyyy-MM-dd');
    if (availability[dateKey]) {
      setPrice(availability[dateKey].price);
      setIsAvailable(availability[dateKey].is_available);
    } else {
      setPrice(defaultPrice);
      setIsAvailable(true);
    }
  };

  const isDateReserved = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations?.some(reservation => {
      const checkIn = format(new Date(reservation.check_in_date), 'yyyy-MM-dd');
      const checkOut = format(new Date(reservation.check_out_date), 'yyyy-MM-dd');
      return dateStr >= checkIn && dateStr <= checkOut;
    }) || false;
  };

  const handleSave = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    if (isDateReserved(selectedDate)) {
      toast.error('Cannot modify reserved dates');
      return;
    }

    setIsLoading(true);
    try {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const response = await propertyService.updateRoomAvailability(propertyId, room.id, {
        date: dateKey,
        price: parseFloat(price) || defaultPrice,
        is_available: isAvailable
      });
      
      if (response.data) {
        // Update local state with the returned data
        setAvailability(prev => ({
          ...prev,
          [dateKey]: {
            is_available: response.data.status === 'available',
            price: response.data.price
          }
        }));
      }
      
      await fetchRoomAvailability();
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Error updating room availability:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const getDayClass = (date) => {
    const isSelected = isSameDay(date, selectedDate);
    const isReserved = isDateReserved(date);
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayAvailability = availability[dateKey];
    const isCurrentMonth = isSameMonth(date, currentDate);

    let classes = 'p-2 text-center transition-colors';
    
    if (!isCurrentMonth) {
      classes += ' text-gray-400';
    } else if (isReserved) {
      classes += ' bg-red-100';
    } else if (dayAvailability?.is_available === false) {
      classes += ' bg-red-100';
    } else if (dayAvailability?.price !== room?.price_per_night) {
      classes += ' bg-green-100';
    }

    if (isSelected) {
      classes += ' ring-2 ring-blue-500';
    }

    return classes;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="min-h-screen px-4 text-center">
        <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block w-full max-w-4xl p-6 my-8 text-left align-middle bg-white rounded-lg shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-semibold">{room?.name || 'Room'} Calendar</h2>
              <p className="text-sm text-gray-500 mt-1">Manage room availability and pricing</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="flex items-center justify-between p-4">
                  <button onClick={handlePrevMonth} className="p-1">
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <h2 className="text-lg font-semibold">
                    {format(currentDate, 'MMMM yyyy')}
                  </h2>
                  <button onClick={handleNextMonth} className="p-1">
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="border-t">
                  <div className="grid grid-cols-7 gap-px">
                    {DAYS_OF_WEEK.map(day => (
                      <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
                        {day}
                      </div>
                    ))}
                    {getDaysInMonth(currentDate).map((date, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleDateSelect(date)}
                        disabled={isDateReserved(date)}
                        className={getDayClass(date)}
                      >
                        {format(date, 'd')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Legend</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
                    <span>Reserved/Unavailable</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
                    <span>Available with Custom Price</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-4">
                  Price for {format(selectedDate, 'MMM dd, yyyy')}
                </h3>
                
                {isDateReserved(selectedDate) ? (
                  <div className="text-red-600 text-sm mb-4">
                    This date is reserved and cannot be modified
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full p-2 border rounded mb-4"
                      placeholder="Enter price per night"
                    />
                    <label className="flex items-center space-x-2 mb-4">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Room is available</span>
                    </label>
                  </>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading || isDateReserved(selectedDate)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCalendar; 