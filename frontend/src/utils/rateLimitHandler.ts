// Rate limit tracking
const rateLimitInfo = {
  isLimited: false,
  resetTime: null as Date | null,
  retryAfter: null as number | null,
};

export const handleRateLimitError = (error: any) => {
  if (error?.response?.status === 429) {
    rateLimitInfo.isLimited = true;
    
    // Try to get retry-after header
    const retryAfter = error.response.headers['retry-after'];
    if (retryAfter) {
      rateLimitInfo.retryAfter = parseInt(retryAfter) * 1000; // Convert to milliseconds
      rateLimitInfo.resetTime = new Date(Date.now() + rateLimitInfo.retryAfter);
    } else {
      // Default to 1 hour if no retry-after header
      rateLimitInfo.retryAfter = 60 * 60 * 1000;
      rateLimitInfo.resetTime = new Date(Date.now() + rateLimitInfo.retryAfter);
    }
    
    const message = error.response.data || 'Too many requests. Please try again later.';
    throw new Error(message);
  }
  throw error;
};

export const isRateLimited = () => {
  if (rateLimitInfo.isLimited && rateLimitInfo.resetTime) {
    if (new Date() > rateLimitInfo.resetTime) {
      // Reset time has passed
      rateLimitInfo.isLimited = false;
      rateLimitInfo.resetTime = null;
      rateLimitInfo.retryAfter = null;
      return false;
    }
    return true;
  }
  return false;
};

export const getRateLimitResetTime = () => rateLimitInfo.resetTime;

export const getRateLimitMessage = () => {
  if (!isRateLimited()) return null;
  
  const now = new Date();
  const resetTime = rateLimitInfo.resetTime!;
  const diff = resetTime.getTime() - now.getTime();
  const minutes = Math.ceil(diff / (1000 * 60));
  
  if (minutes > 60) {
    const hours = Math.ceil(minutes / 60);
    return `Rate limited. Please try again in ${hours} hour${hours > 1 ? 's' : ''}.`;
  }
  
  return `Rate limited. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
};
