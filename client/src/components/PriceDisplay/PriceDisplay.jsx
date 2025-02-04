import React from 'react';
import { format } from 'date-fns';

const PriceDisplay = ({ totalPrice, priceBreakdown, defaultPrice, checkInDate, checkOutDate }) => {
  if (!checkInDate || !checkOutDate) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Price Breakdown</h3>
      <div className="space-y-2">
        {Object.entries(priceBreakdown || {}).map(([date, info]) => (
          <div key={date} className="flex justify-between text-sm">
            <span>{format(new Date(date), 'MMM d, yyyy')}</span>
            <span>${info.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-2 border-t border-gray-200">
        <div className="flex justify-between font-semibold">
          <span>Total Price</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceDisplay;
