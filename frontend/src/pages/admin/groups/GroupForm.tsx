import React from 'react';
import { CreateGroupDto } from '../../../types';

interface GroupFormProps {
  data: CreateGroupDto;
  onChange: (field: keyof CreateGroupDto, value: string) => void;
}

const GroupForm: React.FC<GroupFormProps> = ({ data, onChange }) => (
  <>
    <div>
      <label className='block text-sm font-medium text-gray-700'>Group Name</label>
      <input
        type='text'
        value={data.name}
        onChange={(e) => onChange('name', e.target.value)}
        className='mt-1 block w-full rounded-md border-gray-300 shadow-sm'
      />
    </div>
    <div>
      <label className='block text-sm font-medium text-gray-700'>Description</label>
      <textarea
        value={data.description}
        onChange={(e) => onChange('description', e.target.value)}
        className='mt-1 block w-full rounded-md border-gray-300 shadow-sm'
      />
    </div>
  </>
);

export default GroupForm;
