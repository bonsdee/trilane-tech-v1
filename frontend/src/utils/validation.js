// Client-side rules that mirror the backend, so most mistakes are caught
// before sending. The backend still checks everything.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9+()\-.\s]{5,40}$/;
const WEBSITE = /^\S+\.\S+$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateContact(v) {
  const e = {};
  const name = v.fullName.trim();
  if (!name) e.fullName = 'Enter your name.';
  else if (name.length > 120) e.fullName = 'Use at most 120 characters.';
  const email = v.email.trim();
  if (!email) e.email = 'Enter your email address.';
  else if (!EMAIL.test(email) || email.length > 254) e.email = 'Enter a valid email address.';
  if (v.phone.trim() && !PHONE.test(v.phone.trim())) e.phone = 'Enter a valid phone number.';
  if (v.company.trim().length > 160) e.company = 'Use at most 160 characters.';
  const site = v.websiteUrl.trim();
  if (site && (!WEBSITE.test(site) || site.length > 255)) e.websiteUrl = 'Enter a website address, like example.com.';
  const message = v.message.trim();
  if (!message) e.message = 'Tell us a little about what you need.';
  else if (message.length < 10 || message.length > 5000) e.message = 'Write between 10 and 5,000 characters.';
  return e;
}

export function validateEmail(value) {
  const email = value.trim();
  if (!email) return 'Enter your email address.';
  if (!EMAIL.test(email)) return 'Enter a valid email address.';
  return null;
}

export function validateNewPassword(password, confirm) {
  const e = {};
  if (password.length < 10) e.password = 'Use at least 10 characters.';
  else if (password.length > 72) e.password = 'Use at most 72 characters.';
  if (confirm !== password) e.confirm = 'The passwords do not match.';
  return e;
}

export function validateSlug(value) {
  if (!value.trim()) return 'Enter a URL name.';
  if (!SLUG.test(value)) return 'Use lowercase letters, numbers and single hyphens, like "my-project".';
  if (value.length > 80) return 'Use at most 80 characters.';
  return null;
}

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
