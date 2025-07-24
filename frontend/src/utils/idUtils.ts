import type { ID } from '../types/common';
import { idToString } from '../types/common';

/**
 * Safely format an ID for use in API URLs
 * @param id - The ID to format (can be number or string)
 * @returns The ID as a string
 */
export const formatIdForApi = (id: ID): string => {
  return idToString(id);
};

/**
 * Parse multiple IDs from a comma-separated string
 * @param idsString - Comma-separated string of IDs
 * @returns Array of IDs
 */
export const parseMultipleIds = (idsString: string): ID[] => {
  return idsString.split(',').map(id => {
    const trimmed = id.trim();
    const numId = Number(trimmed);
    if (!isNaN(numId) && trimmed === String(numId)) {
      return numId;
    }
    return trimmed;
  });
};

/**
 * Convert an array of IDs to a comma-separated string for API calls
 * @param ids - Array of IDs
 * @returns Comma-separated string
 */
export const idsToString = (ids: ID[]): string => {
  return ids.map(id => idToString(id)).join(',');
};
