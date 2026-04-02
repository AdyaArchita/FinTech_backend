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

router.get('/', authenticate, getRecords);  //GET /api/records — all roles(supports: type, category, startDate, endDate, search, page, limit)

router.get('/:id', authenticate, getRecordById);  //GET /api/records/:id — all roles

router.post('/', authenticate, authorize(['Admin']), createRecord);  //POST /api/records — Admin only

router.put('/:id', authenticate, authorize(['Admin']), updateRecord);  //PUT /api/records/:id — Admin only

router.delete('/:id', authenticate, authorize(['Admin']), deleteRecord);  //DELETE /api/records/:id — Admin only(soft delete)

module.exports = router;