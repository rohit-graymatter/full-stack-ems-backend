import { Router } from 'express';

import {
  getEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee
} from '../Controllers/employeeController.js';

import { protect } from '../Middleware/authMiddleware.js';

const employeeRoute = Router();

employeeRoute.use(protect);

employeeRoute.post('/', addEmployee);
employeeRoute.get('/', getEmployees);
employeeRoute.get('/:id', getEmployeeById);
employeeRoute.put('/:id', updateEmployee);
employeeRoute.delete('/:id', deleteEmployee);

export default employeeRoute;
