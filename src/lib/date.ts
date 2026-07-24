/**
 * Parses a date string, forcing it to UTC if it does not contain a timezone offset.
 * This prevents local timezone shift issues (e.g. date parsed in the future).
 */
export const parseUTCDate = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date();
  
  // If there's no timezone designator (Z or +/-offset), append 'Z' to force UTC
  if (!/[Zz]|[+-]\d{2}:?\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'Z');
  }
  
  return new Date(dateStr);
};
