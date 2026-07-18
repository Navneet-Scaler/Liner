import { parseISO } from "date-fns";

/**
 * `new Date("2026-07-18")` parses as UTC midnight, which shifts to the
 * previous/next local day depending on timezone offset. Our deadline /
 * startDate / day-tracker fields are plain "yyyy-MM-dd" strings with no
 * time component, so they must be parsed as local dates via parseISO.
 */
export function parseLocalDate(dateOnly: string): Date {
  return parseISO(dateOnly);
}
