const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['Admin']), getAllUsers);  //GET /api/users — list all users (with optional filters: role, status, page, limit)

router.get('/:id', authenticate, authorize(['Admin']), getUserById);  //GET /api/users/:id — get a specific user

router.patch('/:id/role', authenticate, authorize(['Admin']), updateUserRole);  //PATCH /api/users/:id/role — update a user's role

router.patch('/:id/status', authenticate, authorize(['Admin']), updateUserStatus);  //PATCH /api/users/:id/status — activate or deactivate a user

router.delete('/:id', authenticate, authorize(['Admin']), deleteUser);  //DELETE /api/users/:id — permanently delete a user

module.exports = router;