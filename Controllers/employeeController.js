import redisClient from '../utils/redisClient.js';
import Employee from '../Models/employeeModel.js';

export const getEmployees = async (req, res) => {
  try {
    const cached = await redisClient.get('employees:all');
    if (cached) {
      await redisClient.incr('analytics:getEmployees'); // Analytics
      return res.status(200).json(JSON.parse(cached));
    }

    const employees = await Employee.find();
    await redisClient.set('employees:all', JSON.stringify(employees), { EX: 3600 });

    await redisClient.incr('analytics:getEmployees'); // Analytics
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const addEmployee = async (req, res) => {
  try {
    const { name, email, department } = req.body;
    if (!name || !email || !department) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newEmployee = new Employee({ name, email, department });
    await newEmployee.save();

    await redisClient.del('employees:all'); // invalidate cache
    await redisClient.incr('analytics:addEmployee'); // Analytics

    // Pub/Sub for add
    await redisClient.publish('employee:add', JSON.stringify({ name, email, department }));

    res.status(201).json({ message: 'Employee added successfully!', employee: newEmployee });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department } = req.body;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { name, email, department },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await redisClient.del('employees:all'); // invalidate cache
    await redisClient.incr('analytics:updateEmployee'); // Analytics

    // Pub/Sub for update
    await redisClient.publish('employee:update', JSON.stringify({
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      department: updatedEmployee.department,
      _id: updatedEmployee._id
    }));

    res.status(200).json({ message: 'Employee updated successfully', employee: updatedEmployee });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEmployee = await Employee.findByIdAndDelete(id);

    if (!deletedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await redisClient.del('employees:all'); // invalidate cache
    await redisClient.incr('analytics:deleteEmployee'); // Analytics

    // Pub/Sub for delete
    await redisClient.publish('employee:delete', JSON.stringify({
      name: deletedEmployee.name,
      email: deletedEmployee.email,
      department: deletedEmployee.department,
      _id: deletedEmployee._id
    }));

    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json(employee);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
