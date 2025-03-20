import React from 'react';

// Simplified version with no external dependencies
function Flights() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Find Flights to Romania
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <p className="text-gray-600 mb-6 text-center">
              Search for the best flights to beautiful destinations in Romania
            </p>
            
            <div className="h-[600px] w-full border border-gray-200 rounded-lg">
              <iframe 
                src="https://www.google.com/travel/flights"
                title="Google Flights"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Flights; 