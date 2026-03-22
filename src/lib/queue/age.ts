export const PASSIVE_DEBT_RUST_AFTER_DAYS = 7;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HOUR_IN_MS = 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'always' });

export function getQueueAgeMeta(createdAt: string, now: Date | number = Date.now()) {
  const createdAtMs = new Date(createdAt).getTime();
  const nowMs = typeof now === 'number' ? now : now.getTime();
  const diffMs = Math.max(0, nowMs - createdAtMs);
  const daysOld = Math.floor(diffMs / DAY_IN_MS);

  let label: string;

  if (daysOld >= 1) {
    label = relativeTime.format(-daysOld, 'day');
  } else {
    const hoursOld = Math.max(1, Math.floor(diffMs / HOUR_IN_MS));
    if (hoursOld >= 1) {
      label = relativeTime.format(-hoursOld, 'hour');
    } else {
      const minutesOld = Math.max(1, Math.floor(diffMs / MINUTE_IN_MS));
      label = relativeTime.format(-minutesOld, 'minute');
    }
  }

  return {
    label,
    daysOld,
    isRusty: daysOld >= PASSIVE_DEBT_RUST_AFTER_DAYS,
  };
}
