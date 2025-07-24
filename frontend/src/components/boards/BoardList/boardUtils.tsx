import type { Board } from '../../../types';

export const filterAndSortBoards = (
  boards: Board[], 
  filters: any
) => {
  let filtered = [...boards];

  // Filtering
  if (filters.search) {
    filtered = filtered.filter(board => 
      board.name.toLowerCase().includes(filters.search.toLowerCase())
    );
  }
  if (filters.visibility !== 'all') {
    filtered = filtered.filter(board => board.visibility === filters.visibility);
  }

  // Sorting
  filtered.sort((a, b) => {
    if (filters.sortBy === 'name') {
      return filters.sortOrder === 'ASC' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else {
      const dateA = new Date(a[filters.sortBy as keyof Board] as string).getTime();
      const dateB = new Date(b[filters.sortBy as keyof Board] as string).getTime();
      return filters.sortOrder === 'ASC' ? dateA - dateB : dateB - dateA;
    }
  });

  return filtered;
};
