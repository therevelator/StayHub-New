// Function to check if a date is available for booking
export const isDateAvailable = (date, existingBookings) => {
  // Convert the date to start of day for consistent comparison
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  // Check against all existing bookings
  for (const booking of existingBookings) {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    
    // Set hours to start of day for consistent comparison
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);
    
    // Check if target date falls within a booking period
    // Note: We consider checkout dates as available (>= checkIn && < checkOut)
    if (targetDate >= checkIn && targetDate < checkOut) {
      return false; // Date is not available
    }
  }
  
  return true; // Date is available
}; 