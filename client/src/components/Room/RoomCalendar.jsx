import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import propertyService from '../../services/propertyService';
import { toast } from 'react-hot-toast';

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const ROOM_STATUSES = {
  AVAILABLE: 'available',
  MAINTENANCE: 'maintenance',
  BLOCKED: 'blocked'
};

const STATUS_COLORS = {
  [ROOM_STATUSES.AVAILABLE]: 'bg-green-100',
  [ROOM_STATUSES.MAINTENANCE]: 'bg-orange-100',
  [ROOM_STATUSES.BLOCKED]: 'bg-gray-100',
  RESERVED: 'bg-red-100',
  CUSTOM_PRICE: 'bg-green-100'
};

const RoomCalendar = ({ propertyId, room, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [price, setPrice] = useState(room?.price_per_night || 0);
  const [roomStatus, setRoomStatus] = useState(ROOM_STATUSES.AVAILABLE);
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState({});
  const [defaultPrice, setDefaultPrice] = useState(room?.price_per_night || 0);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    if (propertyId && room?.id) {
      fetchRoomAvailability();
      fetchRoomReservations();
    }
  }, [propertyId, room?.id, currentDate]);

  const fetchRoomAvailability = async () => {
    try {
      // Get first and last day of the displayed month
      const firstDay = startOfMonth(currentDate);
      const lastDay = endOfMonth(currentDate);
      
      const startDateStr = format(firstDay, 'yyyy-MM-dd');
      const endDateStr = format(lastDay, 'yyyy-MM-dd');

      console.log('Fetching availability for:', { startDateStr, endDateStr });
      
      const response = await propertyService.getRoomAvailability(propertyId, room.id, startDateStr, endDateStr);
      console.log('Availability response:', response.data);
      setDefaultPrice(response.data.default_price);
      setAvailability(response.data.availability || {});
      console.log('Set availability state:', response.data.availability || {});
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

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else {
      if (date < selectedStartDate) {
        setSelectedStartDate(date);
        setSelectedEndDate(selectedStartDate);
      } else {
        setSelectedEndDate(date);
      }
    }

    const dateKey = format(date, 'yyyy-MM-dd');
    if (availability[dateKey]) {
      setPrice(availability[dateKey].price);
      setRoomStatus(availability[dateKey].status || ROOM_STATUSES.AVAILABLE);
    } else {
      setPrice(defaultPrice);
      setRoomStatus(ROOM_STATUSES.AVAILABLE);
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
    if (!selectedStartDate) {
      toast.error('Please select a start date');
      return;
    }

    const endDate = selectedEndDate || selectedStartDate;
    const dates = eachDayOfInterval({ start: selectedStartDate, end: endDate });

    // Check if any date in range is reserved
    if (dates.some(date => isDateReserved(date))) {
      toast.error('Cannot modify reserved dates in the selected range');
      return;
    }

    setIsLoading(true);
    try {
      const updates = dates.map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        price: parseFloat(price) || defaultPrice,
        status: roomStatus,
        reason: roomStatus // Add reason to match server expectations
      }));
      console.log('Sending updates:', updates);

      const response = await propertyService.updateRoomAvailability(propertyId, room.id, {
        updates
      });
      
      // After successful update, refresh the availability data
      await fetchRoomAvailability();
      await fetchRoomReservations();
      
      await fetchRoomAvailability();
      toast.success('Changes saved successfully');
      
      // Reset selection after save
      setSelectedStartDate(null);
      setSelectedEndDate(null);
    } catch (error) {
      console.error('Error updating room availability:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const getDayClass = (date) => {
    const isSelected = selectedStartDate && selectedEndDate 
      ? isWithinInterval(date, { start: selectedStartDate, end: selectedEndDate })
      : isSameDay(date, selectedStartDate);
    const isReserved = isDateReserved(date);
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayAvailability = availability[dateKey];
    console.log('Day availability for', dateKey, ':', dayAvailability);
    const isCurrentMonth = isSameMonth(date, currentDate);

    let classes = 'p-2 text-center transition-colors';
    
    if (!isCurrentMonth) {
      classes += ' text-gray-400';
    } else if (isReserved) {
      classes += ` ${STATUS_COLORS.RESERVED} text-red-800`;
    } else if (dayAvailability?.status === ROOM_STATUSES.MAINTENANCE) {
      classes += ` ${STATUS_COLORS[ROOM_STATUSES.MAINTENANCE]} text-orange-800`;
    } else if (dayAvailability?.status === ROOM_STATUSES.BLOCKED) {
      classes += ` ${STATUS_COLORS[ROOM_STATUSES.BLOCKED]} text-gray-800`;
    } else if (dayAvailability?.status === ROOM_STATUSES.AVAILABLE) {
      if (dayAvailability?.price !== room?.price_per_night) {
        classes += ` ${STATUS_COLORS.CUSTOM_PRICE} text-green-800`;
      } else {
        classes += ` ${STATUS_COLORS[ROOM_STATUSES.AVAILABLE]} text-green-800`;
      }
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
                    <div className={`w-4 h-4 rounded mr-2 ${STATUS_COLORS.RESERVED}`}></div>
                    <span>Reserved/Occupied</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded mr-2 ${STATUS_COLORS[ROOM_STATUSES.MAINTENANCE]}`}></div>
                    <span>Maintenance</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded mr-2 ${STATUS_COLORS[ROOM_STATUSES.BLOCKED]}`}></div>
                    <span>Blocked</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded mr-2 ${STATUS_COLORS[ROOM_STATUSES.AVAILABLE]}`}></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded mr-2 ${STATUS_COLORS.CUSTOM_PRICE}`}></div>
                    <span>Custom Price</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-4">
                  {selectedStartDate && selectedEndDate
                    ? `Update ${format(selectedStartDate, 'MMM dd')} - ${format(selectedEndDate, 'MMM dd, yyyy')}`
                    : selectedStartDate
                    ? `Update ${format(selectedStartDate, 'MMM dd, yyyy')}`
                    : 'Select dates to update'}
                </h3>
                
                {selectedStartDate && (isDateReserved(selectedStartDate) || (selectedEndDate && isDateReserved(selectedEndDate))) ? (
                  <div className="text-red-600 text-sm mb-4">
                    Some dates in the selected range are reserved and cannot be modified
                  </div>
                ) : selectedStartDate ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Room Status
                      </label>
                      <select
                        value={roomStatus}
                        onChange={(e) => setRoomStatus(e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value={ROOM_STATUSES.AVAILABLE}>Available</option>
                        <option value={ROOM_STATUSES.MAINTENANCE}>Maintenance</option>
                        <option value={ROOM_STATUSES.BLOCKED}>Blocked</option>
                      </select>
                    </div>

                    {roomStatus === ROOM_STATUSES.AVAILABLE && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price per Night
                        </label>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full p-2 border rounded"
                          placeholder="Enter price per night"
                        />
                      </div>
                    )}
                  </>
                ) : null}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading || (selectedStartDate && isDateReserved(selectedStartDate)) || (selectedEndDate && isDateReserved(selectedEndDate))}
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