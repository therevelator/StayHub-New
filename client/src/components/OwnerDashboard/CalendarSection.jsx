import React, { useState } from 'react';
import { Calendar } from 'react-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'react-hot-toast';
import { propertyOwnerService } from '../../services/propertyOwnerService';

export const CalendarSection = ({ selectedProperty }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Convert blocked dates to Date objects for the calendar
  const blockedDates = selectedProperty.blocked_dates?.map(date => new Date(date.date)) || [];

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleBlockDate = async () => {
    if (!selectedDate || !blockReason.trim()) {
      toast.error('Please select a date and provide a reason');
      return;
    }

    try {
      setLoading(true);
      await propertyOwnerService.blockDate(selectedProperty.id, {
        date: selectedDate.toISOString().split('T')[0],
        reason: blockReason
      });
      toast.success('Date blocked successfully');
      setSelectedDate(null);
      setBlockReason('');
      // Refresh property data
    } catch (error) {
      console.error('Error blocking date:', error);
      toast.error('Failed to block date');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockDate = async (date) => {
    try {
      setLoading(true);
      await propertyOwnerService.unblockDate(selectedProperty.id, date.toISOString().split('T')[0]);
      toast.success('Date unblocked successfully');
      // Refresh property data
    } catch (error) {
      console.error('Error unblocking date:', error);
      toast.error('Failed to unblock date');
    } finally {
      setLoading(false);
    }
  };

  const tileClassName = ({ date }) => {
    if (blockedDates.some(blockedDate => 
      blockedDate.getFullYear() === date.getFullYear() &&
      blockedDate.getMonth() === date.getMonth() &&
      blockedDate.getDate() === date.getDate()
    )) {
      return 'bg-amber-100 text-amber-800';
    }
    return 'hover:bg-green-100';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Property Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              onChange={handleDateClick}
              value={selectedDate}
              tileClassName={tileClassName}
              minDate={new Date()}
              className="w-full border rounded-lg p-4"
            />
          </CardContent>
        </Card>

        {/* Block Date Form */}
        <Card>
          <CardHeader>
            <CardTitle>Block Dates</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-4">
                <p>Selected Date: {selectedDate.toLocaleDateString()}</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reason for blocking
                  </label>
                  <textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    rows={3}
                    placeholder="Enter reason for blocking this date"
                  />
                </div>
                <Button
                  onClick={handleBlockDate}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Blocking...' : 'Block Date'}
                </Button>
              </div>
            ) : (
              <p className="text-gray-500">Select a date on the calendar to block it</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Blocked Dates List */}
      <Card>
        <CardHeader>
          <CardTitle>Blocked Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedProperty.blocked_dates?.map((blockedDate) => (
              <div
                key={blockedDate.date}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-medium">
                    {new Date(blockedDate.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">{blockedDate.reason}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblockDate(new Date(blockedDate.date))}
                  disabled={loading}
                >
                  Unblock
                </Button>
              </div>
            ))}
            {!selectedProperty.blocked_dates?.length && (
              <p className="text-gray-500">No blocked dates</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 