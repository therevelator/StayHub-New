import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import roomService from '../../services/roomService';

const RoomPriceManager = ({ propertyId, roomId, defaultPrice }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [price, setPrice] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !price) {
      setError('Please select a date and enter a price');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await roomService.updateAvailability(
        propertyId,
        roomId,
        format(selectedDate, 'yyyy-MM-dd'),
        parseFloat(price),
        isAvailable
      );

      if (response.data.status === 'success') {
        setSelectedDate(null);
        setPrice('');
        setIsAvailable(true);
        alert('Price updated successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update price');
      console.error('Error updating price:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Manage Room Price</h3>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            minDate={new Date()}
            placeholderText="Select date"
            className="w-full p-2 border rounded-md"
            dateFormat="yyyy-MM-dd"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={`Default price: $${defaultPrice}`}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">Available for booking</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Price'}
        </button>
      </form>
    </div>
  );
};

export default RoomPriceManager;
