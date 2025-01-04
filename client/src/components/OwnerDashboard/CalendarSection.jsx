import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format, addDays, isWithinInterval, isSameDay } from 'date-fns';
import { Calendar } from 'react-calendar';
import { XCircleIcon } from '@heroicons/react/24/outline';
import propertyOwnerService from '../../services/propertyOwnerService';

const CalendarSection = ({ selectedProperty }) => {
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDates, setSelectedDates] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
    notes: ''
  });

  useEffect(() => {
    if (selectedProperty) {
      fetchBlockedDates();
    }
  }, [selectedProperty]);

  const fetchBlockedDates = async () => {
    if (!selectedProperty) return;
    
    try {
      setLoading(true);
      const response = await propertyOwnerService.getBlockedDates(selectedProperty.id);
      setBlockedDates(response.data.map(block => ({
        ...block,
        start_date: new Date(block.start_date),
        end_date: new Date(block.end_date)
      })));
    } catch (error) {
      toast.error('Failed to fetch blocked dates');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates) => {
    setSelectedDates(dates);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProperty || !selectedDates) return;

    try {
      await propertyOwnerService.blockDates(selectedProperty.id, {
        startDate: format(selectedDates[0], 'yyyy-MM-dd'),
        endDate: format(selectedDates[1], 'yyyy-MM-dd'),
        ...formData
      });
      toast.success('Dates blocked successfully');
      setShowForm(false);
      setSelectedDates(null);
      setFormData({ reason: '', notes: '' });
      fetchBlockedDates();
    } catch (error) {
      toast.error('Failed to block dates');
    }
  };

  const handleUnblock = async (blockId) => {
    if (!window.confirm('Are you sure you want to unblock these dates?')) return;

    try {
      await propertyOwnerService.unblockDates(blockId);
      toast.success('Dates unblocked successfully');
      fetchBlockedDates();
    } catch (error) {
      toast.error('Failed to unblock dates');
    }
  };

  const tileDisabled = ({ date, view }) => {
    if (view !== 'month') return false;
    return date < new Date();
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';

    const isBlocked = blockedDates.some(block =>
      isWithinInterval(date, { start: block.start_date, end: block.end_date })
    );

    if (isBlocked) {
      return 'bg-red-100 text-red-800';
    }

    if (selectedDates && selectedDates.length === 2) {
      if (
        isWithinInterval(date, {
          start: selectedDates[0],
          end: selectedDates[1]
        }) ||
        isSameDay(date, selectedDates[0]) ||
        isSameDay(date, selectedDates[1])
      ) {
        return 'bg-primary-100 text-primary-800';
      }
    }

    return '';
  };

  if (!selectedProperty) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">
          Please select a property to manage calendar
        </h3>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage availability for {selectedProperty.name}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Calendar */}
        <div className="col-span-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <Calendar
                selectRange
                onChange={handleDateChange}
                value={selectedDates}
                tileDisabled={tileDisabled}
                tileClassName={tileClassName}
                minDate={new Date()}
                className="w-full"
              />
            )}
          </div>

          {/* Block Dates Form */}
          {showForm && (
            <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Block Dates</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Selected Dates
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    {format(selectedDates[0], 'MMM d, yyyy')} -{' '}
                    {format(selectedDates[1], 'MMM d, yyyy')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedDates(null);
                      setFormData({ reason: '', notes: '' });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Block Dates
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Blocked Dates List */}
        <div className="col-span-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Blocked Dates</h2>
            {blockedDates.length === 0 ? (
              <p className="text-sm text-gray-500">No blocked dates</p>
            ) : (
              <ul className="space-y-4">
                {blockedDates.map((block) => (
                  <li
                    key={block.id}
                    className="flex items-start justify-between p-4 bg-red-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {format(block.start_date, 'MMM d')} -{' '}
                        {format(block.end_date, 'MMM d, yyyy')}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{block.reason}</p>
                      {block.notes && (
                        <p className="mt-1 text-xs text-gray-500">{block.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleUnblock(block.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSection; 