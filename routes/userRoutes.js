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

// All user management routes require Admin role

// GET  /api/users          — list all users (with optional filters: role, status, page, limit)
router.get('/', authenticate, authorize(['Admin']), getAllUsers);

// GET  /api/users/:id      — get a specific user
router.get('/:id', authenticate, authorize(['Admin']), getUserById);

// PATCH /api/users/:id/role   — update a user's role
router.patch('/:id/role', authenticate, authorize(['Admin']), updateUserRole);

// PATCH /api/users/:id/status — activate or deactivate a user
router.patch('/:id/status', authenticate, authorize(['Admin']), updateUserStatus);

// DELETE /api/users/:id    — permanently delete a user
router.delete('/:id', authenticate, authorize(['Admin']), deleteUser);

module.exports = router;