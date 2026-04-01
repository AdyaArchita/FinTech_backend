const express = require('express');
const router = express.Router();
const {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} = require('../controllers/recordController');
const { authenticate, authorize } = require('../middleware/auth');

// GET  /api/records         — all roles (supports: type, category, startDate, endDate, search, page, limit)
router.get('/', authenticate, getRecords);

// GET  /api/records/:id     — all roles
router.get('/:id', authenticate, getRecordById);

// POST /api/records         — Admin only
router.post('/', authenticate, authorize(['Admin']), createRecord);

// PUT  /api/records/:id     — Admin only
router.put('/:id', authenticate, authorize(['Admin']), updateRecord);

// DELETE /api/records/:id  — Admin only (soft delete)
router.delete('/:id', authenticate, authorize(['Admin']), deleteRecord);

module.exports = router;