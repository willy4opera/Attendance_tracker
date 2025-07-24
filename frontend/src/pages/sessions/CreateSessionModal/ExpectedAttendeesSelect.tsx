import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, XMarkIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string;
}

interface ExpectedAttendeesSelectProps {
  selectedUserIds: string[];
  availableUsers: UserOption[];
  loading: boolean;
  onChange: (userIds: string[]) => void;
  onSearchUsers?: (search: string) => void;
  error?: string;
}

const ExpectedAttendeesSelect: React.FC<ExpectedAttendeesSelectProps> = ({
  selectedUserIds,
  availableUsers,
  loading,
  onChange,
  onSearchUsers,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get selected users for display
  const selectedUsers = availableUsers.filter(user => selectedUserIds.includes(user.id));

  // Filter available users based on search term
  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search input changes
  useEffect(() => {
    if (onSearchUsers) {
      const debounceTimer = setTimeout(() => {
        onSearchUsers(searchTerm);
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, onSearchUsers]);

  const handleUserSelect = (userId: string) => {
    const newSelectedUserIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    
    onChange(newSelectedUserIds);
  };

  const handleRemoveUser = (userId: string) => {
    onChange(selectedUserIds.filter(id => id !== userId));
  };

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === availableUsers.length) {
      // Deselect all
      onChange([]);
    } else {
      // Select all
      onChange(availableUsers.map(user => user.id));
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Expected Attendees
        <span className="text-gray-500 ml-1">({selectedUserIds.length} selected)</span>
      </label>
      
      <div className="relative" ref={dropdownRef}>
        {/* Main select button */}
        <button
          type="button"
          onClick={handleToggleDropdown}
          className={`w-full px-3 py-2 text-left bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#fddc9a] focus:border-[#fddc9a] ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${isOpen ? 'ring-2 ring-[#fddc9a] border-[#fddc9a]' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {selectedUserIds.length === 0 ? (
                <span className="text-gray-500">Select expected attendees...</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectedUsers.slice(0, 3).map(user => (
                    <span
                      key={user.id}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-[#fddc9a] text-gray-800"
                    >
                      <UserIcon className="w-3 h-3 mr-1" />
                      {user.name}
                      <span
                        
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveUser(user.id);
                        }}
                        className="ml-1 hover:text-red-600 cursor-pointer"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </span>
                    </span>
                  ))}
                  {selectedUserIds.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-200 text-gray-600">
                      +{selectedUserIds.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
            <ChevronDownIcon 
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`} 
            />
          </div>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 flex flex-col">
            {/* Search input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#fddc9a] focus:border-[#fddc9a]"
                />
              </div>
            </div>

            {/* Select all option */}
            {availableUsers.length > 0 && (
              <div className="px-3 py-2 border-b border-gray-100">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center w-full px-2 py-2 text-sm text-left hover:bg-gray-50 rounded-md"
                >
                  <div className="flex items-center justify-center w-4 h-4 mr-3 border border-gray-300 rounded">
                    {selectedUserIds.length === availableUsers.length && (
                      <CheckIcon className="w-3 h-3 text-[#fddc9a]" />
                    )}
                    {selectedUserIds.length > 0 && selectedUserIds.length < availableUsers.length && (
                      <div className="w-2 h-2 bg-[#fddc9a] rounded-sm" />
                    )}
                  </div>
                  <span className="font-medium text-gray-700">
                    {selectedUserIds.length === availableUsers.length ? 'Deselect All' : 'Select All'}
                    {availableUsers.length > 0 && (
                      <span className="text-gray-500 ml-1">({availableUsers.length} users)</span>
                    )}
                  </span>
                </button>
              </div>
            )}

            {/* User list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#fddc9a]"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading users...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                </div>
              ) : (
                <div className="py-1">
                  {filteredUsers.map(user => {
                    const isSelected = selectedUserIds.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleUserSelect(user.id)}
                        className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      >
                        <div className="flex items-center justify-center w-4 h-4 mr-3 border border-gray-300 rounded">
                          {isSelected && <CheckIcon className="w-3 h-3 text-[#fddc9a]" />}
                        </div>
                        <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {user.name}
                          </div>
                          <div className="text-gray-500 truncate text-xs">
                            {user.email}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected users tags (alternative compact view when closed) */}
      {selectedUserIds.length > 0 && !isOpen && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedUsers.map(user => (
            <span
              key={user.id}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700 border"
            >
              <UserIcon className="w-3 h-3 mr-1" />
              {user.name}
              <button
                type="button"
                onClick={() => handleRemoveUser(user.id)}
                className="ml-1 hover:text-red-600 cursor-pointer"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Select users who are expected to attend this session. This will help track attendance rates.
      </p>
    </div>
  );
};

export default ExpectedAttendeesSelect;
