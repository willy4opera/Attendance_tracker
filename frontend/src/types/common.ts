// Common type for ID that can be either number or string (UUID)
export type ID = number | string;

// Helper function to determine if an ID is a UUID
export const isUUID = (id: ID): boolean => {
  if (typeof id === 'number') return false;
  
  // UUID v4 regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Helper function to safely convert ID to string for API calls
export const idToString = (id: ID): string => {
  return String(id);
};

// Helper function to parse ID from route params (always returns string)
export const parseIdFromRoute = (id: string): ID => {
  // Try to parse as number if it's a numeric string
  const numId = Number(id);
  if (!isNaN(numId) && id === String(numId)) {
    return numId;
  }
  return id;
};
