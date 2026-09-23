const COMMON_DOMAIN_CORRECTIONS: Record<string, string> = {
  'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'outlook.cm': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlok.com': 'outlook.com',
  'hotmail.cm': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'yahoo.cm': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'icloud.cm': 'icloud.com',
  'icloud.con': 'icloud.com',
};

export const getEmailValidationError = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return 'Enter your email address.';

  const email = value.trim().toLowerCase();
  if (email.length > 254) return 'Email address must be 254 characters or fewer.';
  if (/\s/.test(email)) return 'Email address cannot contain spaces.';

  const parts = email.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return 'Enter a complete email address, for example name@example.com.';
  }

  const [localPart, domain] = parts;
  if (localPart.length > 64 || localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return 'Check the part of the email address before the @ symbol.';
  }
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(localPart)) {
    return 'The email address contains an unsupported character.';
  }

  const correction = COMMON_DOMAIN_CORRECTIONS[domain];
  if (correction) return `Did you mean ${localPart}@${correction}?`;

  const labels = domain.split('.');
  if (labels.length < 2 || labels.some(label => !label || label.startsWith('-') || label.endsWith('-') || !/^[a-z0-9-]+$/i.test(label))) {
    return 'Enter a valid email domain, for example gmail.com or outlook.com.';
  }
  if (!/^[a-z]{2,63}$/i.test(labels.at(-1) || '')) {
    return 'Enter a valid email ending, such as .com, .co.za, or .org.';
  }

  return null;
};

export const isValidEmail = (value: unknown) => getEmailValidationError(value) === null;
