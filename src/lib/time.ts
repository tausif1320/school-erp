// utils/ist.ts

// Returns 'YYYY-MM-DD' for India Time
export function getISTDateString(): string {
  return new Date().toLocaleDateString('en-CA', { 
    timeZone: 'Asia/Kolkata' 
  });
}

// Formats a UTC timestamp into a readable IST string
export function formatToIST(isoString: string | null): string {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}