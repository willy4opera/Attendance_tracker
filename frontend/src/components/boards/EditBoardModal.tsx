import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  FileText, 
  Briefcase, 
  Building2, 
  Eye, 
  Palette, 
  Save, 
  XCircle,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import type { Board, UpdateBoardDto } from '../../types';
import { useProjects } from '../../hooks/useProjects';
import { useDepartments } from '../../hooks/useDepartments';
import theme from '../../config/theme';
import Swal from 'sweetalert2';

interface EditBoardModalProps {
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string | number, data: UpdateBoardDto) => Promise<Board | null>;
}

const COLORS = [
  '#0079BF', // Blue
  '#D29034', // Orange
  '#519839', // Green
  '#B04632', // Red
  '#89609E', // Purple
  '#CD5A91', // Pink
  '#4BBF6B', // Lime
  '#00AECC', // Cyan
  '#838C91', // Gray
];

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', description: 'Only you can see' },
  { value: 'department', label: 'Department', description: 'Department members' },
  { value: 'organization', label: 'Organization', description: 'All organization' },
  { value: 'public', label: 'Public', description: 'Anyone with link' },
];

const EditBoardModal: React.FC<EditBoardModalProps> = ({
  board,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<UpdateBoardDto>({
    name: board.name,
    description: board.description || '',
    projectId: board.projectId,
    departmentId: board.departmentId,
    backgroundColor: board.backgroundColor,
    visibility: board.visibility,
  });
  const [loading, setLoading] = useState(false);

  // Fetch projects and departments for dropdown options
  const { projects } = useProjects();
  const { departments } = useDepartments();

  useEffect(() => {
    // Reset form when board changes
    setFormData({
      name: board.name,
      description: board.description || '',
      projectId: board.projectId,
      departmentId: board.departmentId,
      backgroundColor: board.backgroundColor,
      visibility: board.visibility,
    });
  }, [board]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Board name is required',
        confirmButtonColor: theme.colors.primary,
        background: '#fff',
        color: theme.colors.secondary,
      });
      return;
    }

    // Show confirmation dialog
    const confirmResult = await Swal.fire({
      title: 'Update Board?',
      html: `
        <div style="text-align: left;">
          <p><strong>Board Name:</strong> ${formData.name}</p>
          ${formData.description ? `<p><strong>Description:</strong> ${formData.description}</p>` : ''}
          <p><strong>Visibility:</strong> ${formData.visibility}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: theme.colors.secondary,
      cancelButtonColor: theme.colors.primary,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel',
      background: '#fff',
      color: theme.colors.secondary,
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    // Show loading state
    Swal.fire({
      title: 'Updating Board...',
      html: '<div class="swal2-loading-spinner"></div>',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: 'colored-popup',
      },
    });

    setLoading(true);

    try {
      const updatedBoard = await onSave(board.id, formData);
      
      if (updatedBoard) {
        // Close the modal first
        onClose();
        
        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Board Updated!',
          text: `${formData.name} has been updated successfully`,
          confirmButtonColor: theme.colors.secondary,
          background: '#fff',
          color: theme.colors.secondary,
          iconColor: theme.colors.primary,
          timer: 2000,
          timerProgressBar: true,
        });
      } else {
        throw new Error('Failed to update board');
      }
    } catch (error) {
      console.error('Error updating board:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update board. Please try again.',
        confirmButtonColor: theme.colors.secondary,
        background: '#fff',
        color: theme.colors.secondary,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UpdateBoardDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? null : value,
    }));
  };

  const handleClose = () => {
    // Check if there are unsaved changes
    const hasChanges = 
      formData.name !== board.name ||
      formData.description !== (board.description || '') ||
      formData.projectId !== board.projectId ||
      formData.departmentId !== board.departmentId ||
      formData.backgroundColor !== board.backgroundColor ||
      formData.visibility !== board.visibility;

    if (hasChanges) {
      Swal.fire({
        title: 'Discard Changes?',
        text: 'You have unsaved changes. Are you sure you want to close?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: theme.colors.secondary,
        cancelButtonColor: theme.colors.primary,
        confirmButtonText: 'Yes, discard',
        cancelButtonText: 'Keep editing',
        background: '#fff',
        color: theme.colors.secondary,
      }).then((result) => {
        if (result.isConfirmed) {
          onClose();
        }
      });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden">
        {/* Header with gradient */}
        <div 
          className="relative p-6 pb-4"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.secondary}dd 100%)`
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <Sparkles className="w-full h-full" style={{ color: theme.colors.primary }} />
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: theme.colors.primary + '20' }}
              >
                <Edit3 className="w-6 h-6" style={{ color: theme.colors.primary }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  Edit Board
                </h2>
                <p className="text-sm opacity-80" style={{ color: theme.colors.primary }}>
                  Update your board settings
                </p>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{
                backgroundColor: theme.colors.primary + '20',
                color: theme.colors.primary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
                e.currentTarget.style.color = theme.colors.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary + '20';
                e.currentTarget.style.color = theme.colors.primary;
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Board Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: theme.colors.secondary }}>
              <Edit3 className="w-4 h-4" style={{ color: theme.colors.secondary }} />
              Board Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 border-2"
              style={{
                '--tw-ring-color': theme.colors.primary,
                borderColor: theme.colors.primary,
                backgroundColor: '#d9d9d9'
              } as React.CSSProperties}
              placeholder="Enter board name"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: theme.colors.secondary }}>
              <FileText className="w-4 h-4" style={{ color: theme.colors.secondary }} />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 resize-none border-2"
              style={{
                '--tw-ring-color': theme.colors.primary,
                borderColor: theme.colors.primary,
                backgroundColor: '#d9d9d9'
              } as React.CSSProperties}
              placeholder="Describe your board..."
              rows={3}
            />
          </div>

          {/* Project and Department */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: theme.colors.secondary }}>
                <Briefcase className="w-4 h-4" style={{ color: theme.colors.secondary }} />
                Project
              </label>
              <select
                value={formData.projectId || ''}
                onChange={(e) => handleChange('projectId', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer border-2"
                style={{
                  '--tw-ring-color': theme.colors.primary,
                  borderColor: theme.colors.primary,
                  backgroundColor: '#d9d9d9'
                } as React.CSSProperties}
              >
                <option value="">No Project</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: theme.colors.secondary }}>
                <Building2 className="w-4 h-4" style={{ color: theme.colors.secondary }} />
                Department
              </label>
              <select
                value={formData.departmentId || ''}
                onChange={(e) => handleChange('departmentId', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer border-2"
                style={{
                  '--tw-ring-color': theme.colors.primary,
                  borderColor: theme.colors.primary,
                  backgroundColor: '#d9d9d9'
                } as React.CSSProperties}
              >
                <option value="">No Department</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: theme.colors.secondary }}>
              <Eye className="w-4 h-4" style={{ color: theme.colors.secondary }} />
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('visibility', option.value)}
                  className={`p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                    formData.visibility === option.value
                      ? 'ring-2 ring-offset-2'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    '--tw-ring-color': theme.colors.primary,
                    backgroundColor: formData.visibility === option.value ? theme.colors.primary : '#d9d9d9',
                    borderColor: theme.colors.primary
                  } as React.CSSProperties}
                >
                  <div className="font-medium" style={{ color: formData.visibility === option.value ? theme.colors.secondary : theme.colors.secondary }}>
                    {option.label}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: formData.visibility === option.value ? theme.colors.secondary : theme.colors.text.secondary }}>
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: theme.colors.secondary }}>
              <Palette className="w-4 h-4" style={{ color: theme.colors.secondary }} />
              Background Color
            </label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('backgroundColor', color)}
                  className={`w-12 h-12 rounded-xl transition-all duration-200 hover:scale-110 border-2 ${
                    formData.backgroundColor === color
                      ? 'ring-4 ring-offset-2 scale-110'
                      : ''
                  }`}
                  style={{ 
                    backgroundColor: color,
                    borderColor: theme.colors.primary,
                    '--tw-ring-color': theme.colors.primary
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t" style={{ borderColor: theme.colors.primary + '20' }}>
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200"
              style={{
                backgroundColor: theme.colors.primary + '10',
                color: theme.colors.secondary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary + '20';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
              }}
              disabled={loading}
            >
              <XCircle className="w-5 h-5" />
              Cancel
            </button>
            
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              style={{
                backgroundColor: theme.colors.secondary,
                color: theme.colors.primary,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = theme.colors.primary;
                  e.currentTarget.style.color = theme.colors.secondary;
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                  e.currentTarget.style.color = theme.colors.primary;
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                }
              }}
              disabled={loading}
            >
              <Save className="w-5 h-5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBoardModal;
