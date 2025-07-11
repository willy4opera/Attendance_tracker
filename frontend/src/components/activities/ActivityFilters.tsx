import React from 'react';

interface ActivityFiltersProps {
  filters: {
    activityType: string;
    page: number;
    limit: number;
  };
  onFiltersChange: (filters: any) => void;
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({ 
  filters, 
  onFiltersChange 
}) => {
  const activityTypes = [
    { value: '', label: 'All Activities' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'commented', label: 'Commented' },
    { value: 'liked', label: 'Liked' },
    { value: 'assigned', label: 'Assigned' },
  ];

  const handleTypeChange = (activityType: string) => {
    onFiltersChange({
      ...filters,
      activityType,
      page: 1, // Reset to first page when filtering
    });
  };

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
      {activityTypes.map((type) => (
        <button
          key={type.value}
          onClick={() => handleTypeChange(type.value)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.activityType === type.value
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
};

export default ActivityFilters;
