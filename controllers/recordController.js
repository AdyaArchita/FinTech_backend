const Record = require('../models/Record');
const { z } = require('zod');

// ─── Validation Schemas ───────────────────────────────────────────────────────

const recordSchema = z.object({
  amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be positive'),
  type: z.enum(['Income', 'Expense'], { required_error: 'Type must be Income or Expense' }),
  category: z.string({ required_error: 'Category is required' }).min(1, 'Category cannot be empty').trim(),
  date: z.string().optional().transform((val) => (val ? new Date(val) : new Date())),
  description: z.string().max(250, 'Description cannot exceed 250 characters').optional(),
});

const updateRecordSchema = recordSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);

// ─── Create Record (Admin only) ───────────────────────────────────────────────

exports.createRecord = async (req, res, next) => {
  try {
    const parsed = recordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const record = await Record.create({
      ...parsed.data,
      userId: req.user.id,
    });

    res.status(201).json({ message: 'Record created successfully', record });
  } catch (err) {
    next(err);
  }
};

// ─── Get All Records with Filtering & Pagination (All roles) ──────────────────

exports.getRecords = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 10, search } = req.query;

    const query = { isDeleted: false };

    if (type) {
      if (!['Income', 'Expense'].includes(type)) {
        return res.status(400).json({ message: 'type must be Income or Expense' });
      }
      query.type = type;
    }

    if (category) query.category = { $regex: category, $options: 'i' };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start)) return res.status(400).json({ message: 'Invalid startDate format' });
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end)) return res.status(400).json({ message: 'Invalid endDate format' });
        query.date.$lte = end;
      }
    }

    // Search in description or category
    if (search) {
      query.$or = [
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      Record.find(query).sort({ date: -1 }).skip(skip).limit(limitNum),
      Record.countDocuments(query),
    ]);

    res.json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      records,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Record (All roles) ───────────────────────────────────────────

exports.getRecordById = async (req, res, next) => {
  try {
    const record = await Record.findOne({ _id: req.params.id, isDeleted: false });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (err) {
    next(err);
  }
};

// ─── Update Record (Admin only) ───────────────────────────────────────────────

exports.updateRecord = async (req, res, next) => {
  try {
    const parsed = updateRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const record = await Record.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!record) return res.status(404).json({ message: 'Record not found' });

    res.json({ message: 'Record updated successfully', record });
  } catch (err) {
    next(err);
  }
};

// ─── Soft Delete Record (Admin only) ─────────────────────────────────────────

exports.deleteRecord = async (req, res, next) => {
  try {
    const record = await Record.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!record) return res.status(404).json({ message: 'Record not found' });

    res.json({ message: 'Record deleted successfully (soft delete)' });
  } catch (err) {
    next(err);
  }
};