export interface ActivityLogEntry {
  id: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export function formatLog(userEmail: string, action: string, details: string): ActivityLogEntry {
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userEmail,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
}

