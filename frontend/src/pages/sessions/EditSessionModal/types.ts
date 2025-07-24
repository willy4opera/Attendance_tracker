export interface EditSessionFormData {
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

export interface EditSessionModalProps {
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export interface EditModalHeaderProps {
  onClose: () => void;
}

export interface EditSessionFormProps {
  formData: EditSessionFormData;
  errors: Partial<EditSessionFormData>;
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
