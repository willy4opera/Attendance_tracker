export interface AttendanceRecord {
  id: string;
  sessionTitle: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  markedAt: string;
  sessionId?: string;
  userId?: string;
  userName?: string;
  notes?: string;
}

export interface TableHeaderProps {
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  recordCount: number;
}

export interface TableListViewProps {
  records: AttendanceRecord[];
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  formatStatus: (status: string) => { text: string; color: string };
}

export interface TableGridViewProps {
  records: AttendanceRecord[];
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  formatStatus: (status: string) => { text: string; color: string };
}

export interface EmptyStateProps {
  message?: string;
}
