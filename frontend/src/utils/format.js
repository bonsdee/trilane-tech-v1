const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: 0 });

/** "$2,800" or "$1,500 / month". Prices are US dollars. */
export function formatPrice(amount, billingPeriod) {
  if (amount === null || amount === undefined) return '';
  const value = money.format(Number(amount));
  return billingPeriod === 'MONTHLY' ? `${value} / month` : value;
}

export function formatMoney(amount) {
  return amount === null || amount === undefined ? '' : money.format(Number(amount));
}

const dateFmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** Formats a "YYYY-MM-DD" date without shifting it across time zones. */
export function formatDate(value) {
  if (!value) return '';
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return dateFmt.format(new Date(y, m - 1, d));
}

export function formatDateTime(value) {
  return value ? dateTimeFmt.format(new Date(value)) : '';
}

export function formatPercent(fraction) {
  if (fraction === null || fraction === undefined) return '—';
  return `${Math.round(Number(fraction) * 1000) / 10}%`;
}

/** "Jose Louis B. Enecio (JL)" → "JE": ignores nicknames in brackets and non-letters. */
export function initials(name = '') {
  const parts = name
    .replace(/\(.*?\)/g, ' ')
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/[^\p{L}]/gu, ''))
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const LEAD_STATUSES = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
];

export const statusLabel = (value) => LEAD_STATUSES.find((s) => s.value === value)?.label || value;

export const CATEGORY_LABELS = { ONE_TIME: 'One-time project', RETAINER: 'Retainer', BUNDLE: 'Bundle' };
