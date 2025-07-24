import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from '../utils/requestOptimizer';

interface UseDebouncedSearchOptions {
  delay?: number;
  minLength?: number;
}

export const useDebouncedSearch = <T>(
  searchFn: (query: string) => Promise<T>,
  options: UseDebouncedSearchOptions = {}
) => {
  const { delay = 300, minLength = 2 } = options;
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create debounced search function
  const debouncedSearchRef = useRef(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < minLength) {
        setResults(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await searchFn(searchQuery);
        setResults(data);
      } catch (err: any) {
        setError(err.message || 'Search failed');
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, delay)
  );

  // Handle query changes
  useEffect(() => {
    if (query.length === 0) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    debouncedSearchRef.current(query);
  }, [query]);

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    query,
    results,
    loading,
    error,
    handleSearch,
    clearSearch,
  };
};

// Example usage hook for board search
export const useDebouncedBoardSearch = () => {
  const searchBoards = async (query: string) => {
    const { default: boardService } = await import('../services/boardService');
    return boardService.searchBoards(query);
  };

  return useDebouncedSearch(searchBoards, {
    delay: 500,
    minLength: 3,
  });
};
