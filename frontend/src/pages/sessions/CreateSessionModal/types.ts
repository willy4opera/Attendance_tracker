export interface SessionFormData {
  title: string;
  description: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  meetingType: 'online' | 'offline' | 'hybrid';
  meetingLink: string;
  maxAttendees: number;
  category: string;
  tags: string[];
  attachments?: File[];
  
  // New expected attendees field
  expectedAttendees: string[]; // Array of user IDs
}

export interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface ModalHeaderProps {
  onClose: () => void;
}

export interface SessionFormProps {
  formData: SessionFormData;
  errors: Partial<SessionFormData>;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onAddTag: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveTag: (tag: string) => void;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onFileChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onClose: () => void;
  
  // New props for expected attendees
  onExpectedAttendeesChange: (userIds: string[]) => void;
  availableUsers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    name: string;
  }>;
  loadingUsers: boolean;
}

export interface FormFieldProps {
  formData: SessionFormData;
  errors: Partial<SessionFormData>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export interface FileUploadProps {
  files: File[];
  onFileChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
}

export interface TagInputProps {
  tags: string[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveTag: (tag: string) => void;
}

export interface MeetingTypeSelectProps {
  meetingType: 'online' | 'offline' | 'hybrid';
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// New component for expected attendees selection
export interface ExpectedAttendeesSelectProps {
  selectedUserIds: string[];
  availableUsers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    name: string;
  }>;
  loading: boolean;
  onChange: (userIds: string[]) => void;
  onSearchUsers?: (search: string) => void;
}
