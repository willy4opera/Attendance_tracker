import React from 'react';
import { TagIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { TagInputProps } from './types';

const TagInput: React.FC<TagInputProps> = ({
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag
}) => {
  return (
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <TagIcon className="inline h-5 w-5 mr-1" />
        Tags
      </label>
      <div className="space-y-2">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => onTagInputChange(e.target.value)}
          onKeyDown={onAddTag}
          placeholder="Type a tag and press Enter"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#fddc9a] text-black"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="ml-2 text-black hover:text-gray-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagInput;
