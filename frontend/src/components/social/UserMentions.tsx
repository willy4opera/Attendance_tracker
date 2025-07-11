import React, { useState, useEffect, useRef } from 'react';
import { useSocial } from '../../hooks/useSocial';
import UserAvatar from './UserAvatar';

interface UserMentionsProps {
  content: string;
  onContentChange: (content: string) => void;
  onUserMention?: (userId: number) => void;
}

const UserMentions: React.FC<UserMentionsProps> = ({
  content,
  onContentChange,
  onUserMention,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { searchUsers, searchResults, isSearching } = useSocial();

  useEffect(() => {
    // Check if user typed @ symbol
    const lastAtIndex = content.lastIndexOf('@', cursorPosition);
    const lastSpaceIndex = content.lastIndexOf(' ', cursorPosition);
    
    if (lastAtIndex > lastSpaceIndex && lastAtIndex !== -1) {
      const query = content.substring(lastAtIndex + 1, cursorPosition);
      if (query.length > 0) {
        setMentionQuery(query);
        setShowSuggestions(true);
        searchUsers(query);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [content, cursorPosition, searchUsers]);

  const handleUserSelect = (user: any) => {
    const beforeMention = content.substring(0, content.lastIndexOf('@'));
    const afterMention = content.substring(cursorPosition);
    const newContent = `${beforeMention}@${user.firstName} ${user.lastName}${afterMention}`;
    
    onContentChange(newContent);
    setShowSuggestions(false);
    
    if (onUserMention) {
      onUserMention(user.id);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          onContentChange(e.target.value);
          setCursorPosition(e.target.selectionStart || 0);
        }}
        onKeyUp={(e) => {
          setCursorPosition(e.currentTarget.selectionStart || 0);
        }}
        placeholder="Type @ to mention someone..."
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={3}
      />

      {/* Mentions Suggestions */}
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {isSearching ? (
            <div className="p-3 text-center text-gray-500">
              Searching users...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 text-left"
              >
                <UserAvatar user={user} size="sm" />
                <div>
                  <div className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {user.email}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserMentions;
