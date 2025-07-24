import api from './api';

// Get overall statistics
export const getOverallStats = async () => {
  try {
    const response = await api.get('/attendance-stats/overall');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get dashboard statistics
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/attendance-stats/dashboard');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get comprehensive statistics
export const getComprehensiveStats = async (startDate?: string, endDate?: string) => {
  try {
    const params = { startDate, endDate };
    const response = await api.get('/attendance-stats/comprehensive', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};
