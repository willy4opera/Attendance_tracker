import { useState, useEffect } from 'react';

export type ViewMode = 'grid' | 'list';

export const useViewMode = (storageKey: string, defaultMode: ViewMode = 'grid') => {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    const savedView = localStorage.getItem(storageKey) as ViewMode;
    if (savedView && (savedView === 'grid' || savedView === 'list')) {
      setViewMode(savedView);
    }
  }, [storageKey]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(storageKey, mode);
  };

  return { viewMode, handleViewModeChange };
};
