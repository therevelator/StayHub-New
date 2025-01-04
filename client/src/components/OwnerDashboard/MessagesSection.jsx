import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format, isValid, parseISO } from 'date-fns';
import propertyOwnerService from '../../services/propertyOwnerService';

const MessagesSection = ({ selectedProperty }) => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProperty) {
      fetchBookings();
    }
  }, [selectedProperty]);

  useEffect(() => {
    if (selectedBooking) {
      fetchMessages();
    }
  }, [selectedBooking]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid date';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Invalid date';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'MMM d, yyyy h:mm a') : 'Invalid date';
  };

  const fetchBookings = async () => {
    if (!selectedProperty) return;

    try {
      setLoading(true);
      const response = await propertyOwnerService.getPropertyBookings(selectedProperty.id);
      const bookingsData = response.data?.data || [];
      setBookings(bookingsData);
      if (bookingsData.length > 0) {
        setSelectedBooking(bookingsData[0]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedBooking) return;

    try {
      const response = await propertyOwnerService.getBookingMessages(selectedBooking.id);
      setMessages(response.data?.data || []);
      await propertyOwnerService.markMessagesAsRead(selectedBooking.id);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedBooking || !newMessage.trim()) return;

    try {
      await propertyOwnerService.sendMessage(selectedBooking.id, {
        content: newMessage.trim()
      });
      setNewMessage('');
      fetchMessages();
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (!selectedProperty) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">
          Please select a property to view messages
        </h3>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">
          Communicate with guests for {selectedProperty.name}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No Bookings Found</h3>
          <p className="mt-2 text-sm text-gray-500">
            There are no bookings for this property yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bookings List */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Bookings</h2>
            <div className="space-y-2">
              {bookings.map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`w-full text-left p-3 rounded-md ${
                    selectedBooking?.id === booking.id
                      ? 'bg-primary-50 border-primary-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {booking.guest_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(booking.check_in)} -{' '}
                    {formatDate(booking.check_out)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-4">
            {selectedBooking ? (
              <>
                <div className="border-b pb-4 mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Conversation with {selectedBooking.guest_name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Booking dates: {formatDate(selectedBooking.check_in)} -{' '}
                    {formatDate(selectedBooking.check_out)}
                  </p>
                </div>

                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No messages yet</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === selectedBooking.guest_id
                            ? 'justify-start'
                            : 'justify-end'
                        }`}
                      >
                        <div
                          className={`rounded-lg px-4 py-2 max-w-[70%] ${
                            message.sender_id === selectedBooking.guest_id
                              ? 'bg-gray-100'
                              : 'bg-primary-100'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="mt-4">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">
                  Select a booking to view messages
                </h3>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesSection; 