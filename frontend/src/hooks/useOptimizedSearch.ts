import { useDebouncedSearch } from './useDebouncedSearch';
import { 
  optimizedUserService,
  optimizedDepartmentService,
  optimizedProjectService,
  optimizedTaskService,
  optimizedSessionService,
  optimizedSocialService
} from '../services/optimizedServices';

// User search with debouncing
export const useUserSearch = (delay = 500) => {
  return useDebouncedSearch(
    async (query: string) => optimizedUserService.searchUsers(query),
    { delay, minLength: 2 }
  );
};

// Department search with debouncing
export const useDepartmentSearch = (delay = 500) => {
  return useDebouncedSearch(
    async (query: string) => optimizedDepartmentService.searchDepartments(query),
    { delay, minLength: 2 }
  );
};

// Project search with debouncing
export const useProjectSearch = (delay = 500) => {
  return useDebouncedSearch(
    async (query: string) => optimizedProjectService.searchProjects(query),
    { delay, minLength: 2 }
  );
};

// Task search with debouncing
export const useTaskSearch = (boardId: number, delay = 500) => {
  return useDebouncedSearch(
    async (query: string) => optimizedTaskService.searchTasks(boardId, query),
    { delay, minLength: 2 }
  );
};

// Session search with debouncing
export const useSessionSearch = (delay = 500) => {
  return useDebouncedSearch(
    async (query: string) => optimizedSessionService.searchSessions(query),
    { delay, minLength: 2 }
  );
};

// User mention search with shorter delay for better UX
export const useMentionSearch = (delay = 300) => {
  return useDebouncedSearch(
    async (query: string) => optimizedSocialService.searchUsersForMentions(query),
    { delay, minLength: 1 } // Mentions can start with just 1 character
  );
};

// Generic filter hook with debouncing
export const useDebouncedFilter = <T>(
  filterFn: (filters: any) => Promise<T>,
  delay = 500
) => {
  return useDebouncedSearch(
    async (filterString: string) => {
      const filters = JSON.parse(filterString);
      return filterFn(filters);
    },
    { delay, minLength: 0 }
  );
};
