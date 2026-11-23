const dayMilliseconds = 24 * 60 * 60 * 1000;
const defaultRangeDays = 30;
const maximumRangeDays = 366;

export type AnalyticsDateRange = {
  from: string;
  to: string;
  max: string;
  start: Date;
  endExclusive: Date;
  days: number;
};

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function makeRange(start: Date, end: Date): AnalyticsDateRange {
  const days = Math.round((end.getTime() - start.getTime()) / dayMilliseconds) + 1;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return {
    from: toDateInputValue(start),
    to: toDateInputValue(end),
    max: toDateInputValue(today),
    start,
    endExclusive: new Date(end.getTime() + dayMilliseconds),
    days,
  };
}

export function getDefaultAnalyticsDateRange() {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (defaultRangeDays - 1));
  return makeRange(start, end);
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || toDateInputValue(date) !== value
    ? null
    : date;
}

export function resolveAnalyticsDateRange(
  fromValue?: string | string[],
  toValue?: string | string[],
): { range: AnalyticsDateRange; error: string | null } {
  const from = Array.isArray(fromValue) ? fromValue[0] : fromValue;
  const to = Array.isArray(toValue) ? toValue[0] : toValue;

  if (!from && !to) {
    return { range: getDefaultAnalyticsDateRange(), error: null };
  }

  const start = from ? parseDate(from) : null;
  const end = to ? parseDate(to) : null;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (!start || !end || start > end || end > today) {
    return {
      range: getDefaultAnalyticsDateRange(),
      error: "Choose a valid start and end date that is not in the future.",
    };
  }

  const range = makeRange(start, end);
  if (range.days > maximumRangeDays) {
    return {
      range: getDefaultAnalyticsDateRange(),
      error: `Date ranges cannot exceed ${maximumRangeDays} days.`,
    };
  }

  return { range, error: null };
}
