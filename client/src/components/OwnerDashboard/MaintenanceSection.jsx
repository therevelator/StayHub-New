import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format, isValid, parseISO } from 'date-fns';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import propertyOwnerService from '../../services/propertyOwnerService';

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusIcons = {
  pending: ClockIcon,
  in_progress: ExclamationCircleIcon,
  completed: CheckCircleIcon,
  cancelled: XCircleIcon
};

const statusColors = {
  pending: 'text-yellow-500',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
  cancelled: 'text-red-500'
};

const MaintenanceSection = ({ selectedProperty }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    roomId: ''
  });

  useEffect(() => {
    if (selectedProperty) {
      fetchTasks();
    }
  }, [selectedProperty]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
  };

  const fetchTasks = async () => {
    if (!selectedProperty) return;
    
    try {
      setLoading(true);
      const response = await propertyOwnerService.getMaintenanceTasks(selectedProperty.id);
      setTasks(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch maintenance tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProperty) return;

    try {
      await propertyOwnerService.createMaintenanceTask(selectedProperty.id, formData);
      toast.success('Task created successfully');
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        roomId: ''
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await propertyOwnerService.updateTaskStatus(taskId, newStatus);
      toast.success('Task status updated');
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await propertyOwnerService.deleteTask(taskId);
      toast.success('Task deleted successfully');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  if (!selectedProperty) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">
          Please select a property to manage maintenance tasks
        </h3>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Tasks</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage maintenance tasks for {selectedProperty.name}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            {showForm ? 'Cancel' : 'New Task'}
          </button>
        </div>
      </div>

      {/* New Task Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Task</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Room (Optional)
                </label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Select Room</option>
                  {selectedProperty.rooms?.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No Maintenance Tasks</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create your first maintenance task to get started
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {tasks.map((task) => {
              const StatusIcon = statusIcons[task.status];
              return (
                <li key={task.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <StatusIcon
                          className={`h-5 w-5 ${statusColors[task.status]}`}
                        />
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">{task.description}</p>
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span>Due: {formatDate(task.due_date)}</span>
                        {task.room_name && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100">
                            Room: {task.room_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-4">
                      {task.status !== 'completed' && task.status !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusUpdate(task.id, 'completed')}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Mark Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MaintenanceSection; 