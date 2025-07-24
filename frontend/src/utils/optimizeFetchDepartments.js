// This script shows how to update fetchDepartments to use caching
// Find and replace the fetchDepartments function with:

const fetchDepartments = useCallback(async () => {
  try {
    setDepartmentsLoading(true)
    const departments = await cachedRequest(
      'user-management-departments',
      async () => {
        const response = await departmentService.getAllDepartments({
          isActive: true,
          limit: 1000
        })
        return response.departments
      },
      5 * 60 * 1000 // Cache for 5 minutes
    )
    setDepartments(departments)
  } catch (error) {
    notify.toast.error('Failed to fetch departments')
  } finally {
    setDepartmentsLoading(false)
  }
}, [])
