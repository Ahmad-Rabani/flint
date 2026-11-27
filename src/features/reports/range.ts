export type ReportRange = {
  from: Date;
  to: Date;
  fromInput: string;
  toInput: string;
  timeZone: string;
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function formatDay(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInputDay(value: string, end: boolean): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return end ? endOfDay(date) : startOfDay(date);
}

/** Inclusive date window. Defaults to the last 30 local days. */
export function parseReportRange(from?: string | null, to?: string | null): ReportRange {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const now = new Date();
  let fromDate = from ? parseInputDay(from, false) : startOfDay(addDays(now, -29));
  let toDate = to ? parseInputDay(to, true) : endOfDay(now);
  if (!fromDate) fromDate = startOfDay(addDays(now, -29));
  if (!toDate) toDate = endOfDay(now);
  if (fromDate > toDate) {
    const swappedFrom = startOfDay(toDate);
    const swappedTo = endOfDay(fromDate);
    fromDate = swappedFrom;
    toDate = swappedTo;
  }
  return {
    from: fromDate,
    to: toDate,
    fromInput: formatDay(fromDate),
    toInput: formatDay(toDate),
    timeZone,
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatReportDay(isoDay: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay);
  if (!match) return isoDay;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function reportHref(path: string, range: Pick<ReportRange, "fromInput" | "toInput">) {
  const params = new URLSearchParams({ from: range.fromInput, to: range.toInput });
  return `${path}?${params.toString()}`;
}

export function rangeLengthDays(range: ReportRange) {
  const from = startOfDay(range.from).getTime();
  const to = startOfDay(range.to).getTime();
  return Math.floor((to - from) / 86_400_000) + 1;
}
