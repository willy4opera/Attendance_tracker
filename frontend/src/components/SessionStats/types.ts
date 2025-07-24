export interface SessionStats {
  total: number;
  active: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  attendance: {
    totalAttendees: number;
    averageAttendance: number;
    attendanceRate: number;
  };
  facilitation?: {
    sessionsCreated: number;
    totalParticipants: number;
  };
}

export interface SessionTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats: SessionStats;
}

export interface SessionStatsCardsProps {
  stats: SessionStats;
  isAdmin: boolean;
}

export type SessionFilterType = 'all' | 'active' | 'upcoming' | 'completed';
