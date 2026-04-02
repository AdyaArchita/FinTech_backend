const Record = require('../models/Record');

//Dashboard Summary(Admin, Analyst, Viewer)
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const baseMatch = { isDeleted: false };

    //Income activity
    const [totals, categoryBreakdown, recentActivity] = await Promise.all([
      Record.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: { $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0] },
            },
            totalExpenses: {
              $sum: { $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0] },
            },
            totalRecords: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            totalIncome: 1,
            totalExpenses: 1,
            netBalance: { $subtract: ['$totalIncome', '$totalExpenses'] },
            totalRecords: 1,
          },
        },
      ]),

      // Category-wise totals(both income and expense)
      Record.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: { category: '$category', type: '$type' },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.category',
            breakdown: {
              $push: { type: '$_id.type', total: '$total', count: '$count' },
            },
            grandTotal: { $sum: '$total' },
          },
        },
        { $sort: { grandTotal: -1 } },
        {
          $project: {
            _id: 0,
            category: '$_id',
            breakdown: 1,
            grandTotal: 1,
          },
        },
      ]),

      // Recent 5 records(separate lean query)
      Record.find(baseMatch)
        .sort({ date: -1 })
        .limit(5)
        .select('amount type category date description'),
    ]);

    const summary = totals[0] || { totalIncome: 0, totalExpenses: 0, netBalance: 0, totalRecords: 0 };

    res.json({
      summary,
      categoryBreakdown,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
};

//Monthly Trends
exports.getMonthlyTrends = async (req, res, next) => {
  try {
    // Default: last 12 months
    const { months = 12 } = req.query;
    const monthsNum = Math.min(24, Math.max(1, Number(months)));

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsNum);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const trends = await Record.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: { year: '$_id.year', month: '$_id.month' },
          data: {
            $push: { type: '$_id.type', total: '$total', count: '$count' },
          },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          data: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    //Normalize into a clean shape:year, month, income, expenses, net
    const normalized = trends.map((entry) => {
      const income = entry.data.find((d) => d.type === 'Income')?.total || 0;
      const expenses = entry.data.find((d) => d.type === 'Expense')?.total || 0;
      return {
        year: entry.year,
        month: entry.month,
        income,
        expenses,
        net: income - expenses,
      };
    });

    res.json({ months: monthsNum, trends: normalized });
  } catch (err) {
    next(err);
  }
};

// ─── Weekly Trends (Admin, Analyst) ──────────────────────────────────────────

exports.getWeeklyTrends = async (req, res, next) => {
  try {
    // Default: last 8 weeks
    const { weeks = 8 } = req.query;
    const weeksNum = Math.min(52, Math.max(1, Number(weeks)));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeksNum * 7);
    startDate.setHours(0, 0, 0, 0);

    const trends = await Record.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$date' },
            week: { $isoWeek: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: { year: '$_id.year', week: '$_id.week' },
          data: {
            $push: { type: '$_id.type', total: '$total', count: '$count' },
          },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          week: '$_id.week',
          data: 1,
        },
      },
      { $sort: { year: 1, week: 1 } },
    ]);

    const normalized = trends.map((entry) => {
      const income = entry.data.find((d) => d.type === 'Income')?.total || 0;
      const expenses = entry.data.find((d) => d.type === 'Expense')?.total || 0;
      return {
        year: entry.year,
        isoWeek: entry.week,
        income,
        expenses,
        net: income - expenses,
      };
    });

    res.json({ weeks: weeksNum, trends: normalized });
  } catch (err) {
    next(err);
  }
};