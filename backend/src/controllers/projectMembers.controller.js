const { getProjectMembers } = require('./aggregateStatistics.controller');

exports.getProjectTaskMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    const members = await getProjectMembers(parseInt(projectId));

    res.status(200).json({
      success: true,
      data: {
        projectId: parseInt(projectId),
        members: Array.isArray(members) ? members : [members],
        totalMembers: Array.isArray(members) ? members.length : 1
      }
    });
  } catch (error) {
    console.error('Error fetching project task members:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};
