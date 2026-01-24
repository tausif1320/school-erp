// src/lib/time.ts

// Returns current time in IST as ISO string
export function nowIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset).toISOString();
}

// Returns today's date in IST (YYYY-MM-DD)
export function todayIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset)
    .toISOString()
    .slice(0, 10);
}
