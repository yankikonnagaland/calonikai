import { nanoid } from 'nanoid';

const SESSION_KEY = 'calorie-tracker-session';

export function getSessionId(): string {
  // Check for admin mode first
  const isAdminMode = localStorage.getItem('admin_mode') === 'true';
  const adminSessionId = localStorage.getItem('session_id');
  
  if (isAdminMode && adminSessionId) {
    return adminSessionId;
  }
  
  // Fallback to localStorage session for unauthenticated users
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    sessionId = nanoid();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
