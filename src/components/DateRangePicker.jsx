import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { isDateAvailable } from '../utils/bookingUtils';

const DateRangePicker = ({ existingBookings, onChange }) => {
  const [selected, setSelected] = useState({ from: undefined, to: undefined });
  
  const handleSelect = (range) => {
    setSelected(range);
    
    if (range?.from && range?.to) {
      // Calculate the nights (checkout day is not counted as a night)
      const nights = calculateNights(range.from, range.to);
      
      onChange({
        startDate: range.from,
        endDate: range.to,
        nights
      });
    }
  };
  
  // Calculate nights between two dates (checkout date not counted)
  const calculateNights = (checkIn, checkOut) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.floor(timeDiff / (1000 * 3600 * 24));
  };
  
  // Create disabled dates array excluding checkout dates
  const getDisabledDates = () => {
    const disabledDates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Loop through next 365 days
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      if (!isDateAvailable(date, existingBookings)) {
        disabledDates.push(new Date(date));
      }
    }
    
    return disabledDates;
  };
  
  return (
    <div className="date-range-picker">
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={handleSelect}
        disabled={[
          { before: new Date() }, // Cannot select dates in the past
          ...getDisabledDates()
        ]}
        footer={
          selected?.from && selected?.to && (
            <p className="mt-2 text-sm">
              {calculateNights(selected.from, selected.to)} night
              {calculateNights(selected.from, selected.to) !== 1 ? 's' : ''}
            </p>
          )
        }
      />
    </div>
  );
};

export default DateRangePicker; 