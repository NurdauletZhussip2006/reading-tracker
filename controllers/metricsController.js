const ReadingLog = require('../models/ReadingLog');
const Book = require('../models/Book');

async function getMetrics(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    // Always the logged-in user's own stats. Unlike reviews, there's no
    // "librarian sees everyone's dashboard" exception here — this is
    // personal analytics, not a moderation surface.
    const matchStage = { userId: new (require('mongoose').Types.ObjectId)(req.user.id) };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }
    // ...(rest of the function is unchanged)

    const [overallStats, genreBreakdown, booksCompleted] = await Promise.all([
      ReadingLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalPagesRead: { $sum: '$pagesRead' },
            totalMinutes: { $sum: '$minutes' },
            avgPagesPerSession: { $avg: '$pagesRead' },
            minPagesPerSession: { $min: '$pagesRead' },
            maxPagesPerSession: { $max: '$pagesRead' },
            stdDevPagesPerSession: { $stdDevPop: '$pagesRead' },
            avgRating: { $avg: '$rating' },
            totalSessions: { $sum: 1 },
          },
        },
      ]),

      ReadingLog.aggregate([
        { $match: matchStage },
        { $match: { genre: { $ne: null } } },
        {
          $group: {
            _id: '$genre',
            sessionCount: { $sum: 1 },
            totalPagesRead: { $sum: '$pagesRead' },
          },
        },
        { $sort: { sessionCount: -1 } },
      ]),

      ReadingLog.aggregate([
        { $match: matchStage },
        { $match: { completionPercent: { $gte: 100 } } },
        {
          $group: {
            _id: '$bookId',
          },
        },
        { $count: 'booksCompleted' },
      ]),
    ]);

    const stats = overallStats[0] || {};
    const totalDays = await getDistinctDayCount(matchStage);

    res.json({
      totalSessions: stats.totalSessions || 0,
      totalPagesRead: stats.totalPagesRead || 0,
      totalMinutes: stats.totalMinutes || 0,
      pagesPerDay: totalDays > 0 ? Math.round((stats.totalPagesRead || 0) / totalDays) : 0,
      readingSpeedPagesPerMinute: stats.totalMinutes
        ? Number((stats.totalPagesRead / stats.totalMinutes).toFixed(2))
        : 0,
      avgPagesPerSession: Number((stats.avgPagesPerSession || 0).toFixed(1)),
      minPagesPerSession: stats.minPagesPerSession || 0,
      maxPagesPerSession: stats.maxPagesPerSession || 0,
      stdDevPagesPerSession: Number((stats.stdDevPagesPerSession || 0).toFixed(1)),
      avgRating: stats.avgRating ? Number(stats.avgRating.toFixed(2)) : null,
      booksCompleted: booksCompleted[0] ? booksCompleted[0].booksCompleted : 0,
      mostReadGenre: genreBreakdown[0] ? genreBreakdown[0]._id : null,
      genreBreakdown: genreBreakdown.map((g) => ({
        genre: g._id,
        sessionCount: g.sessionCount,
        totalPagesRead: g.totalPagesRead,
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function getDistinctDayCount(matchStage) {
  const result = await ReadingLog.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
      },
    },
    { $count: 'distinctDays' },
  ]);
  return result[0] ? result[0].distinctDays : 0;
}

module.exports = { getMetrics };