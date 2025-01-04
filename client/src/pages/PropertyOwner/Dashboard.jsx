import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  HomeIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  BanknotesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import propertyOwnerService from '../../services/propertyOwnerService';
import PropertiesSection from '../../components/OwnerDashboard/PropertiesSection';
import CalendarSection from '../../components/OwnerDashboard/CalendarSection';
import MaintenanceSection from '../../components/OwnerDashboard/MaintenanceSection';
import MessagesSection from '../../components/OwnerDashboard/MessagesSection';
import FinancesSection from '../../components/OwnerDashboard/FinancesSection';
import AnalyticsSection from '../../components/OwnerDashboard/AnalyticsSection';

const navigation = [
  { name: 'Properties', icon: HomeIcon },
  { name: 'Calendar', icon: CalendarIcon },
  { name: 'Maintenance', icon: WrenchScrewdriverIcon },
  { name: 'Messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Finances', icon: BanknotesIcon },
  { name: 'Analytics', icon: ChartBarIcon }
];

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('Properties');
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    fetchProperties();
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyOwnerService.getMyProperties();
      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        setProperties(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedProperty(response.data.data[0]);
        }
      } else {
        console.error('Unexpected response format:', response.data);
        toast.error('Failed to fetch properties: Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await propertyOwnerService.getUnreadCount();
      setUnreadMessages(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread messages count:', error);
    }
  };

  const renderSection = () => {
    const props = { selectedProperty };

    switch (activeSection) {
      case 'Properties':
        return (
          <PropertiesSection
            {...props}
            properties={properties}
            onPropertySelect={setSelectedProperty}
          />
        );
      case 'Calendar':
        return <CalendarSection {...props} />;
      case 'Maintenance':
        return <MaintenanceSection {...props} />;
      case 'Messages':
        return <MessagesSection {...props} />;
      case 'Finances':
        return <FinancesSection {...props} />;
      case 'Analytics':
        return <AnalyticsSection {...props} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              No Properties Found
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              You don't have any properties registered. Please contact the admin to add your properties.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm">
          <div className="h-full flex flex-col">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 px-4">
                <h1 className="text-lg font-semibold text-gray-900">
                  Owner Dashboard
                </h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => setActiveSection(item.name)}
                      className={`${
                        activeSection === item.name
                          ? 'bg-primary-50 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      <Icon
                        className={`${
                          activeSection === item.name
                            ? 'text-primary-500'
                            : 'text-gray-400 group-hover:text-gray-500'
                        } mr-3 h-6 w-6`}
                      />
                      {item.name}
                      {item.name === 'Messages' && unreadMessages > 0 && (
                        <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                          {unreadMessages}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
                    </p>
                    <p className="text-xs font-medium text-gray-500">
                      {selectedProperty?.name || 'Select a property'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="py-8 px-4 sm:px-6 lg:px-8">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 