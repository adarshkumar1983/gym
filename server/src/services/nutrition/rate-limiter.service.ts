/**
 * Rate Limiter Service
 * Handles rate limiting for external API calls
 */

const MAX_REQUESTS_PER_MINUTE = 30;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

let requestCount = 0;
let requestWindowStart = Date.now();

export const checkRateLimit = (): boolean => {
  const now = Date.now();
  
  // Reset window if expired
  if (now - requestWindowStart > RATE_LIMIT_WINDOW) {
    requestCount = 0;
    requestWindowStart = now;
  }
  
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  requestCount++;
  return true;
};

export const resetRateLimit = (): void => {
  requestCount = 0;
  requestWindowStart = Date.now();
};

