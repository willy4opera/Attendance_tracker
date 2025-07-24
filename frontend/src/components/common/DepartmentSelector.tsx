import React, { useState, useEffect, useRef } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon, CheckIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import type { Department } from '../../types'
import departmentService from '../../services/departmentService'
import theme from '../../config/theme'

interface DepartmentSelectorProps {
  selectedDepartments: Department[]
  onChange: (departments: Department[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  maxDepartments?: number
}

export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  selectedDepartments,
  onChange,
  placeholder = "Select departments",
  disabled = false,
  className = "",
  maxDepartments
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!isOpen) return
      
      setLoading(true)
      try {
        const response = await departmentService.getAllDepartments({
          search: searchTerm,
          isActive: true,
          limit: 50
        })
        setDepartments(response.departments)
      } catch (error) {
        console.error('Failed to fetch departments:', error)
        setDepartments([])
      } finally {
        setLoading(false)
      }
    }

    fetchDepartments()
  }, [isOpen, searchTerm])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDepartmentToggle = (department: Department) => {
    const isSelected = selectedDepartments.some(d => d.id === department.id)
    
    if (isSelected) {
      onChange(selectedDepartments.filter(d => d.id !== department.id))
    } else {
      if (maxDepartments && selectedDepartments.length >= maxDepartments) {
        return
      }
      onChange([...selectedDepartments, department])
    }
  }

  const handleRemoveDepartment = (departmentId: string) => {
    onChange(selectedDepartments.filter(d => d.id !== departmentId))
  }

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="w-full px-4 py-3 text-left bg-gray-50 border-2 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        style={{ 
          borderColor: theme.colors.primary,
          backgroundColor: '#d9d9d9',
          '--tw-ring-color': theme.colors.primary 
        } as any}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className="flex items-center justify-between">
          <span className={selectedDepartments.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
            {selectedDepartments.length > 0 
              ? `${selectedDepartments.length} department${selectedDepartments.length > 1 ? 's' : ''} selected`
              : placeholder
            }
          </span>
          <ChevronDownIcon 
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: theme.colors.secondary }}
          />
        </div>
      </button>

      {selectedDepartments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedDepartments.map(dept => (
            <span
              key={dept.id}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm"
              style={{
                backgroundColor: theme.colors.primary + '20',
                color: theme.colors.secondary
              }}
            >
              <BuildingOfficeIcon className="h-3 w-3 mr-1" />
              {dept.name}
              <button
                type="button"
                onClick={() => handleRemoveDepartment(dept.id)}
                className="ml-2 hover:opacity-70"
                style={{ color: theme.colors.secondary }}
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search departments..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{ 
                  borderColor: theme.colors.primary + '40',
                  focusRingColor: theme.colors.primary 
                } as any}
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading departments...</div>
            ) : filteredDepartments.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No departments found</div>
            ) : (
              <ul className="py-1">
                {filteredDepartments.map(dept => {
                  const isSelected = selectedDepartments.some(d => d.id === dept.id)
                  const isDisabled = maxDepartments && selectedDepartments.length >= maxDepartments && !isSelected
                  
                  return (
                    <li
                      key={dept.id}
                      onClick={() => !isDisabled && handleDepartmentToggle(dept)}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${
                        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{dept.name}</div>
                          {dept.description && (
                            <div className="text-sm text-gray-500">{dept.description}</div>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckIcon 
                          className="h-5 w-5" 
                          style={{ color: theme.colors.primary }}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
