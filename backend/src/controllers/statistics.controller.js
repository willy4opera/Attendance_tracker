const { getAggregateStats } = require('./aggregateStatistics.controller');

exports.getProjectStatsReport = async (req, res) => {
  try {
    const report = await getAggregateStats();
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating comprehensive statistics report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};
