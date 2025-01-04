import db from '../db/index.js';

// Get all maintenance tasks for a property
export const getMaintenanceTasks = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const [tasks] = await db.query(
      `SELECT m.*, 
        u.first_name, u.last_name, u.email,
        r.name as room_name
       FROM maintenance_tasks m
       LEFT JOIN users u ON m.assigned_to = u.id
       LEFT JOIN rooms r ON m.room_id = r.id
       WHERE m.property_id = ?
       ORDER BY m.created_at DESC`,
      [propertyId]
    );

    res.json({
      status: 'success',
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching maintenance tasks:', error);
    res.status(500).json({ message: 'Failed to fetch maintenance tasks' });
  }
};

// Create a new maintenance task
export const createMaintenanceTask = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const {
      roomId,
      title,
      description,
      priority,
      assignedTo,
      dueDate
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO maintenance_tasks 
       (property_id, room_id, title, description, priority, assigned_to, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [propertyId, roomId, title, description, priority, assignedTo, dueDate]
    );

    res.status(201).json({
      status: 'success',
      data: {
        id: result.insertId,
        property_id: propertyId,
        room_id: roomId,
        title,
        description,
        priority,
        assigned_to: assignedTo,
        due_date: dueDate,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error creating maintenance task:', error);
    res.status(500).json({ message: 'Failed to create maintenance task' });
  }
};

// Update maintenance task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    await db.query(
      `UPDATE maintenance_tasks 
       SET status = ?,
           completed_at = ${status === 'completed' ? 'CURRENT_TIMESTAMP' : 'NULL'}
       WHERE id = ?`,
      [status, taskId]
    );

    res.json({
      status: 'success',
      message: 'Task status updated successfully'
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: 'Failed to update task status' });
  }
};

// Delete maintenance task
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    await db.query(
      'DELETE FROM maintenance_tasks WHERE id = ?',
      [taskId]
    );

    res.json({
      status: 'success',
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
}; 