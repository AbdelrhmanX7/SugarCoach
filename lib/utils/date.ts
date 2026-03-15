/**
 * Get the current date-time as a local ISO string for datetime-local inputs.
 */
export function getDefaultDateTime(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);

  return local.toISOString().slice(0, 16);
}
