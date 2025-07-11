import React, { useState, useEffect, useCallback } from 'react';
import DepartmentService from '../../services/departmentService';
import type { Department } from '../../services/departmentService';
import CreateDepartmentModal from './CreateDepartmentModal';
import EditDepartmentModal from './EditDepartmentModal';
import DepartmentDetailsModal from './DepartmentDetailsModal';
import { 
  AiOutlinePlus, 
  AiOutlineEdit, 
  AiOutlineEye, 
  AiOutlineDelete,
  AiOutlineSearch,
  AiOutlineReload,
  AiOutlineCheck,
} from 'react-icons/ai';
import { toastSuccess, toastError } from '../../utils/toastHelpers';
import { useAuth } from '../../contexts/useAuth';
import theme from '../../config/theme';
import Swal from 'sweetalert2';

interface DepartmentFilters {
  search?: string;
  isActive?: boolean;
  parentDepartmentId?: string;
}

const DepartmentManagement = () => {
  const { user } = useAuth();
  const [activeDepartments, setActiveDepartments] = useState<Department[]>([]);
  const [inactiveDepartments, setInactiveDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [isMobileView, setIsMobileView] = useState(false);

  const isAdmin = user?.role === 'admin';
  const canModify = isAdmin;

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch active departments
      const activeParams: DepartmentFilters = { isActive: true };
      if (searchTerm) activeParams.search = searchTerm;
      const activeData = await DepartmentService.getAllDepartments(activeParams);
      setActiveDepartments(activeData.departments);

      // Fetch inactive departments
      const inactiveParams: DepartmentFilters = { isActive: false };
      if (searchTerm) inactiveParams.search = searchTerm;
      const inactiveData = await DepartmentService.getAllDepartments(inactiveParams);
      setInactiveDepartments(inactiveData.departments);
      
    } catch (error) {
      console.error('Error fetching departments:', error);
      toastError('Error fetching departments');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDepartments();
  };

  const openCreateModal = () => {
    if (!canModify) {
      toastError('You do not have permission to create departments. Admin access required.');
      return;
    }
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => setIsCreateModalOpen(false);

  const openEditModal = (department: Department) => {
    if (!canModify) {
      toastError('You do not have permission to edit departments. Admin access required.');
      return;
    }
    setSelectedDepartment(department);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDepartment(null);
  };

  const openDetailsModal = (department: Department) => {
    setSelectedDepartment(department);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedDepartment(null);
  };

  const handleDeleteFromActive = async (department: Department) => {
    if (!canModify) {
      toastError('You do not have permission to delete departments. Admin access required.');
      return;
    }

    const result = await Swal.fire({
      title: `Delete "${department.name}"?`,
      text: 'Choose how you want to handle this department:',
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Move to Inactive',
      denyButtonText: 'Delete Permanently',
      cancelButtonText: 'Cancel',
      confirmButtonColor: theme.colors.warning,
      denyButtonColor: theme.colors.error,
      cancelButtonColor: theme.colors.text.secondary,
      html: `
        <div class="text-left mt-4">
          <p class="mb-3"><strong>Choose an action:</strong></p>
          <div class="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
            <p class="text-sm"><strong>Move to Inactive:</strong> Department will be hidden from active view but data is preserved. Can be restored later.</p>
          </div>
          <div class="bg-red-50 border border-red-200 rounded p-3">
            <p class="text-sm"><strong>Delete Permanently:</strong> Department will be completely removed from the database. This action cannot be undone.</p>
          </div>
        </div>
      `
    });

    if (result.isConfirmed) {
      try {
        await DepartmentService.deleteDepartment(department.id, false);
        toastSuccess('Department moved to inactive successfully');
        fetchDepartments();
      } catch (error) {
        console.error('Error moving department to inactive:', error);
        toastError('Failed to move department to inactive');
      }
    } else if (result.isDenied) {
      const confirmResult = await Swal.fire({
        title: 'Are you absolutely sure?',
        text: `This will permanently delete "${department.name}" and cannot be undone!`,
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete permanently',
        cancelButtonText: 'Cancel',
        confirmButtonColor: theme.colors.error,
        cancelButtonColor: theme.colors.text.secondary,
      });

      if (confirmResult.isConfirmed) {
        try {
          await DepartmentService.deleteDepartment(department.id, true);
          toastSuccess('Department permanently deleted');
          fetchDepartments();
        } catch (error) {
          console.error('Error permanently deleting department:', error);
          toastError('Failed to permanently delete department');
        }
      }
    }
  };

  const handleDeleteFromInactive = async (department: Department) => {
    if (!canModify) {
      toastError('You do not have permission to delete departments. Admin access required.');
      return;
    }

    const result = await Swal.fire({
      title: `Permanently Delete "${department.name}"?`,
      text: 'This action cannot be undone! The department will be completely removed from the database.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete permanently',
      cancelButtonText: 'Cancel',
      confirmButtonColor: theme.colors.error,
      cancelButtonColor: theme.colors.text.secondary,
    });

    if (result.isConfirmed) {
      try {
        await DepartmentService.deleteDepartment(department.id, true);
        toastSuccess('Department permanently deleted');
        fetchDepartments();
      } catch (error) {
        console.error('Error permanently deleting department:', error);
        toastError('Failed to permanently delete department');
      }
    }
  };

  const handleRestore = async (department: Department) => {
    if (!canModify) {
      toastError('You do not have permission to restore departments. Admin access required.');
      return;
    }

    const result = await Swal.fire({
      title: `Restore "${department.name}"?`,
      text: 'This will move the department back to the active section.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel',
      confirmButtonColor: theme.colors.success,
      cancelButtonColor: theme.colors.text.secondary,
    });

    if (result.isConfirmed) {
      try {
        await DepartmentService.updateDepartment(department.id, { isActive: true });
        toastSuccess('Department restored successfully');
        fetchDepartments();
      } catch (error) {
        console.error('Error restoring department:', error);
        toastError('Failed to restore department');
      }
    }
  };

  const handleCreateSuccess = () => {
    closeCreateModal();
    toastSuccess('Department created successfully');
    fetchDepartments();
  };

  const handleEditSuccess = () => {
    closeEditModal();
    toastSuccess('Department updated successfully');
    fetchDepartments();
  };

  // Mobile Card View
  const renderMobileCard = (dept: Department, isActive: boolean) => (
    <div 
      key={dept.id} 
      style={{ backgroundColor: theme.colors.background.paper }} 
      className={`rounded-lg shadow p-4 mb-4 ${!isActive ? 'opacity-75' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${!isActive ? 'line-through' : ''}`}
              style={{ color: isActive ? theme.colors.text.primary : theme.colors.text.secondary }}>
            {dept.name}
          </h3>
          <p className="text-sm font-mono" style={{ color: theme.colors.text.secondary }}>
            {dept.code}
          </p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {dept.description && (
        <p className="text-sm mb-3" style={{ color: theme.colors.text.secondary }}>
          {dept.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => openDetailsModal(dept)}
          className="flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors"
          style={{
            backgroundColor: theme.colors.info + '20',
            color: theme.colors.info
          }}
        >
          <AiOutlineEye className="text-base" />
          View
        </button>

        {canModify && (
          <>
            {isActive ? (
              <>
                <button
                  onClick={() => openEditModal(dept)}
                  className="flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors"
                  style={{
                    backgroundColor: theme.colors.primary + '20',
                    color: theme.colors.secondary
                  }}
                >
                  <AiOutlineEdit className="text-base" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteFromActive(dept)}
                  className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm transition-colors hover:bg-red-200"
                >
                  <AiOutlineDelete className="text-base" />
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleRestore(dept)}
                  className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm transition-colors hover:bg-green-200"
                >
                  <AiOutlineCheck className="text-base" />
                  Restore
                </button>
                <button
                  onClick={() => handleDeleteFromInactive(dept)}
                  className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm transition-colors hover:bg-red-200"
                >
                  <AiOutlineDelete className="text-base" />
                  Delete
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Desktop Table View
  const renderDesktopTable = (departments: Department[], isActive: boolean) => (
    <div style={{ backgroundColor: theme.colors.background.paper }} className="rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead style={{ backgroundColor: theme.colors.background.default }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: theme.colors.text.secondary }}>
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: theme.colors.text.secondary }}>
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: theme.colors.text.secondary }}>
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: theme.colors.text.secondary }}>
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: theme.colors.text.secondary }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: theme.colors.background.paper }} className="divide-y divide-gray-200">
            {departments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center" style={{ color: theme.colors.text.secondary }}>
                  {isActive ? 'No active departments found' : 'No inactive departments found'}
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${isActive ? '' : 'line-through opacity-75'}`}
                         style={{ color: isActive ? theme.colors.text.primary : theme.colors.text.secondary }}>
                      {dept.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm" style={{ color: isActive ? theme.colors.text.primary : theme.colors.text.secondary }}>
                      {dept.code}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm max-w-xs truncate" style={{ color: isActive ? theme.colors.text.primary : theme.colors.text.secondary }}>
                      {dept.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetailsModal(dept)}
                        className="p-1 rounded hover:bg-blue-50"
                        style={{ color: theme.colors.info }}
                        title="View Details"
                      >
                        <AiOutlineEye className="text-lg" />
                      </button>
                      {canModify && (
                        <>
                          {isActive ? (
                            <>
                              <button
                                onClick={() => openEditModal(dept)}
                                className="p-1 rounded hover:bg-blue-50"
                                style={{ color: theme.colors.primary }}
                                title="Edit Department"
                              >
                                <AiOutlineEdit className="text-lg" />
                              </button>
                              <button
                                onClick={() => handleDeleteFromActive(dept)}
                                className="p-1 rounded hover:bg-red-50"
                                style={{ color: theme.colors.error }}
                                title="Delete Department"
                              >
                                <AiOutlineDelete className="text-lg" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleRestore(dept)}
                                className="p-1 rounded hover:bg-green-50"
                                style={{ color: theme.colors.success }}
                                title="Restore Department"
                              >
                                <AiOutlineCheck className="text-lg" />
                              </button>
                              <button
                                onClick={() => handleDeleteFromInactive(dept)}
                                className="p-1 rounded hover:bg-red-50"
                                style={{ color: theme.colors.error }}
                                title="Permanently Delete"
                              >
                                <AiOutlineDelete className="text-lg" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.default }}>
        <div className="text-xl" style={{ color: theme.colors.text.secondary }}>Loading departments...</div>
      </div>
    );
  }

  const currentDepartments = activeTab === 'active' ? activeDepartments : inactiveDepartments;

  return (
    <div className="min-h-screen px-2 sm:px-4 lg:px-8 py-4 lg:py-6" style={{ backgroundColor: theme.colors.background.default }}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div style={{ backgroundColor: theme.colors.background.paper }} className="rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: theme.colors.text.primary }}>
                Department Management
              </h1>
              <p className="mt-1 text-sm sm:text-base" style={{ color: theme.colors.text.secondary }}>
                Active: {activeDepartments.length} | Inactive: {inactiveDepartments.length}
                {!isAdmin && (
                  <span className="block sm:inline sm:ml-2 text-xs sm:text-sm" style={{ color: theme.colors.warning }}>
                    (View Only - Admin access required for modifications)
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canModify && (
                <button
                  onClick={openCreateModal}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md transition-colors hover:opacity-90 text-sm sm:text-base"
                  style={{ 
                    backgroundColor: theme.colors.secondary,
                    color: theme.colors.primary
                  }}
                >
                  <AiOutlinePlus className="text-base sm:text-lg" />
                  <span className="hidden sm:inline">Add Department</span>
                  <span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Tabs */}
        <div style={{ backgroundColor: theme.colors.background.paper }} className="rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                                style={{ color: theme.colors.text.secondary }} />
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base"
                  style={{ 
                    borderColor: theme.colors.primary,
                    focusRingColor: theme.colors.primary
                  }}
                />
              </div>
            </form>
            <button
              onClick={fetchDepartments}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md transition-colors hover:opacity-90 text-sm sm:text-base"
              style={{
                backgroundColor: theme.colors.info + '20',
                color: theme.colors.info
              }}
            >
              <AiOutlineReload className="text-base sm:text-lg" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Mobile-friendly Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'active'
                    ? 'border-current'
                    : 'border-transparent hover:border-gray-300'
                }`}
                style={{
                  color: activeTab === 'active' ? theme.colors.success : theme.colors.text.secondary
                }}
              >
                Active ({activeDepartments.length})
              </button>
              <button
                onClick={() => setActiveTab('inactive')}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'inactive'
                    ? 'border-current'
                    : 'border-transparent hover:border-gray-300'
                }`}
                style={{
                  color: activeTab === 'inactive' ? theme.colors.error : theme.colors.text.secondary
                }}
              >
                Inactive ({inactiveDepartments.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Department Display - Mobile Cards or Desktop Table */}
        {isMobileView ? (
          <div className="space-y-4">
            {currentDepartments.length === 0 ? (
              <div style={{ backgroundColor: theme.colors.background.paper }} className="rounded-lg shadow p-8 text-center">
                <p style={{ color: theme.colors.text.secondary }}>
                  {activeTab === 'active' ? 'No active departments found' : 'No inactive departments found'}
                </p>
              </div>
            ) : (
              currentDepartments.map((dept) => renderMobileCard(dept, activeTab === 'active'))
            )}
          </div>
        ) : (
          renderDesktopTable(currentDepartments, activeTab === 'active')
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateDepartmentModal onClose={closeCreateModal} onSuccess={handleCreateSuccess} />
      )}
      {isEditModalOpen && selectedDepartment && (
        <EditDepartmentModal
          department={selectedDepartment}
          onClose={closeEditModal}
          onSuccess={handleEditSuccess}
        />
      )}
      {isDetailsModalOpen && selectedDepartment && (
        <DepartmentDetailsModal
          department={selectedDepartment}
          onClose={closeDetailsModal}
          onEdit={canModify && selectedDepartment.isActive ? () => {
            closeDetailsModal();
            openEditModal(selectedDepartment);
          } : undefined}
        />
      )}
    </div>
  );
};

export default DepartmentManagement;
