import React from 'react';
import {
  CalendarIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  BanknotesIcon,
  ChartBarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { 
    name: 'Properties', 
    icon: BuildingOfficeIcon, 
    section: 'properties',
    description: 'Manage your properties and rooms'
  },
  { 
    name: 'Calendar', 
    icon: CalendarIcon, 
    section: 'calendar',
    description: 'Block dates and manage availability'
  },
  { 
    name: 'Maintenance', 
    icon: WrenchScrewdriverIcon, 
    section: 'maintenance',
    description: 'Track repairs and maintenance tasks'
  },
  { 
    name: 'Messages', 
    icon: ChatBubbleLeftRightIcon, 
    section: 'messages',
    description: 'Communicate with guests'
  },
  { 
    name: 'Finances', 
    icon: BanknotesIcon, 
    section: 'finances',
    description: 'View transactions and revenue'
  },
  { 
    name: 'Analytics', 
    icon: ChartBarIcon, 
    section: 'analytics',
    description: 'View booking statistics and trends'
  }
];

const Sidebar = ({ activeSection, onSectionChange }) => {
  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900">Owner Dashboard</h2>
        <p className="text-sm text-gray-500">Manage your properties</p>
      </div>
      <nav className="space-y-1 px-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => onSectionChange(item.section)}
              className={`
                w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md
                ${
                  activeSection === item.section
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon
                className={`
                  mr-3 h-5 w-5
                  ${
                    activeSection === item.section
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }
                `}
              />
              <div className="flex flex-col items-start">
                <span>{item.name}</span>
                <span className="text-xs text-gray-500">{item.description}</span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar; 