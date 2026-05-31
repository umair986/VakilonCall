const DEV_AUTH_TOKEN_PREFIX = 'dev-bypass:';

const DEV_AUTH_PHONE = process.env.DEV_AUTH_PHONE ?? '+911122334455';
const DEV_AUTH_OTP = process.env.DEV_AUTH_OTP ?? '123456';

export function isDevAuthBypassEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === 'true';
}

export function isDevAuthPhone(phone: string): boolean {
  return phone === DEV_AUTH_PHONE;
}

export function isDevAuthOtp(otp: string): boolean {
  return otp === DEV_AUTH_OTP;
}

export function createDevAccessToken(phone: string): string {
  return `${DEV_AUTH_TOKEN_PREFIX}${phone}`;
}

export function parseDevAccessToken(token: string): string | null {
  if (!token.startsWith(DEV_AUTH_TOKEN_PREFIX)) {
    return null;
  }

  const phone = token.slice(DEV_AUTH_TOKEN_PREFIX.length);
  return phone.length > 0 ? phone : null;
}
