const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

// ─── Validation Schemas ───────────────────────────────────────────────────────

const updateRoleSchema = z.object({
  role: z.enum(['Admin', 'Analyst', 'Viewer']),
});

const updateStatusSchema = z.object({
  status: z.enum(['Active', 'Inactive']),
});

const updateUserSchema = z.object({
  name: z.string().min(2).trim().optional(),
  email: z.string().email().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

// ─── Get All Users (Admin only) ───────────────────────────────────────────────

exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      users,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single User (Admin only) ────────────────────────────────────────────

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ─── Update User Role (Admin only) ───────────────────────────────────────────

exports.updateUserRole = async (req, res, next) => {
  try {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: parsed.data.role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User role updated successfully', user });
  } catch (err) {
    next(err);
  }
};

// ─── Update User Status (Admin only) ─────────────────────────────────────────

exports.updateUserStatus = async (req, res, next) => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: parsed.data.status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User status updated successfully', user });
  } catch (err) {
    next(err);
  }
};

// ─── Delete User (Admin only) ─────────────────────────────────────────────────

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};