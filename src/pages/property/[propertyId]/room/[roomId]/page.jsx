function RoomPage() {
  return (
    <>
      {/* Remove any Header component here if it exists */}
      {/* <Header /> */} 
      
      {/* Your room page content */}
      <div>Room details content</div>
    </>
  );
}

export default RoomPage; 

// Find where the booking price calculation happens
const calculateBookingTotal = (checkInDate, checkOutDate, roomPrice) => {
  // Convert string dates to Date objects if they aren't already
  const startDate = checkInDate instanceof Date ? checkInDate : new Date(checkInDate);
  const endDate = checkOutDate instanceof Date ? checkOutDate : new Date(checkOutDate);
  
  // Set to start of day for consistent comparison
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  // Calculate the time difference in milliseconds
  const timeDiff = endDate.getTime() - startDate.getTime();
  
  // Convert to days (checkout day is not counted as a stay night)
  const nights = Math.floor(timeDiff / (1000 * 3600 * 24));
  
  // Calculate total price
  return nights * roomPrice;
}; 