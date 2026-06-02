import type { ScenarioType, TokenPackName, LanguageCode } from './types';

// =============================================
// APP CONFIGURATION
// =============================================

export const APP_NAME = 'Vakil On Call' as const;
export const APP_VERSION = '0.1.0' as const;
export const APP_BUNDLE_ID = 'com.vakiloncall.app' as const;

// =============================================
// TOKEN PACKS — from Business Report Section 9.1
// =============================================

export const TOKEN_PACKS: ReadonlyArray<{
  name: TokenPackName;
  tokens: number;
  price_inr: number;
  price_paise: number;
  per_token_inr: number;
  badge: string | null;
}> = [
  { name: 'Starter', tokens: 1, price_inr: 59, price_paise: 5900, per_token_inr: 59, badge: null },
  { name: 'Basic', tokens: 3, price_inr: 149, price_paise: 14900, per_token_inr: 49.7, badge: 'Most Popular' },
  { name: 'Standard', tokens: 7, price_inr: 299, price_paise: 29900, per_token_inr: 42.7, badge: 'Best Value' },
  { name: 'Premium', tokens: 15, price_inr: 549, price_paise: 54900, per_token_inr: 36.6, badge: null },
] as const;

// =============================================
// CALL ECONOMICS — from Business Report Section 9.2
// =============================================

export const CALL_ECONOMICS = {
  TOKENS_PER_CALL: 1,
  CALL_MAX_DURATION_SEC: 15 * 60, // 15 minutes
  CALL_MIN_DURATION_FOR_CHARGE_SEC: 2 * 60, // 2 minutes — refund below this
  LAWYER_PAYOUT_INR: 32,
  PLATFORM_REVENUE_INR: 10,
  LAWYER_MIN_RATING: 3.0,
  MATCH_TIMEOUT_SEC: 60,
  LAWYER_ACCEPT_TIMEOUT_SEC: 30,
  MAX_LAWYERS_BROADCAST: 5,
  PAYOUT_HOLD_DAYS: 7,
} as const;

// =============================================
// SCENARIOS — from AI_AGENT_GUARDRAILS.md Section 3
// =============================================

export const SCENARIOS: ReadonlyArray<{
  type: ScenarioType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    type: 'traffic_stop',
    label: 'Traffic Stop',
    description: 'Document check, bribe attempt, vehicle seizure',
    icon: 'car',
  },
  {
    type: 'fir_refusal',
    label: 'FIR Refusal',
    description: 'Police refusing to register your FIR',
    icon: 'file-document-remove',
  },
  {
    type: 'custodial_arrest',
    label: 'Arrest / Custody',
    description: 'Being detained or taken into custody',
    icon: 'handcuffs',
  },
  {
    type: 'domestic_dispute',
    label: 'Domestic Dispute',
    description: 'Family or household legal dispute',
    icon: 'home-alert',
  },
  {
    type: 'digital_scam',
    label: 'Digital Arrest Scam',
    description: 'Verify if a call from "police" or "CBI" is real',
    icon: 'phone-alert',
  },
  {
    type: 'workplace_raid',
    label: 'Workplace Raid',
    description: 'Workplace inspection or raid by authorities',
    icon: 'office-building',
  },
  {
    type: 'eviction',
    label: 'Eviction',
    description: 'Landlord trying to evict you illegally',
    icon: 'home-remove',
  },
  {
    type: 'consumer',
    label: 'Consumer Complaint',
    description: 'Product/service fraud or consumer rights issue',
    icon: 'shopping',
  },
  {
    type: 'other',
    label: 'Other Legal Help',
    description: 'General legal guidance for any situation',
    icon: 'gavel',
  },
] as const;

// =============================================
// SUPPORTED LANGUAGES
// =============================================

export const LANGUAGES: ReadonlyArray<{
  code: LanguageCode;
  label: string;
  native_label: string;
  available_phase: number;
}> = [
  { code: 'en', label: 'English', native_label: 'English', available_phase: 1 },
  { code: 'hi', label: 'Hindi', native_label: 'हिंदी', available_phase: 2 },
  { code: 'ta', label: 'Tamil', native_label: 'தமிழ்', available_phase: 4 },
  { code: 'te', label: 'Telugu', native_label: 'తెలుగు', available_phase: 4 },
  { code: 'kn', label: 'Kannada', native_label: 'ಕನ್ನಡ', available_phase: 4 },
  { code: 'bn', label: 'Bengali', native_label: 'বাংলা', available_phase: 4 },
  { code: 'mr', label: 'Marathi', native_label: 'मराठी', available_phase: 4 },
] as const;

// =============================================
// INDIAN STATES (for Bar Council)
// =============================================

export const INDIAN_BAR_COUNCIL_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
] as const;

// =============================================
// SOS CONFIGURATION
// =============================================

export const SOS_CONFIG = {
  MAX_EMERGENCY_CONTACTS: 3,
  SMS_TEMPLATE: (userName: string, lat: number, lng: number, timestamp: string): string =>
    `URGENT: ${userName} needs help! Location: https://maps.google.com/?q=${lat},${lng} | Time: ${timestamp} | Sent via Vakil On Call`,
} as const;

// =============================================
// RATE LIMITING
// =============================================

export const RATE_LIMITS = {
  OTP_SEND: { windowMs: 60_000, max: 5 },
  TOKEN_PURCHASE: { windowMs: 60_000, max: 10 },
  SOS_FIRE: { windowMs: 60_000, max: 3 },
  CALL_REQUEST: { windowMs: 60_000, max: 5 },
  GENERAL: { windowMs: 60_000, max: 100 },
} as const;

// =============================================
// API PATHS
// =============================================

export const API_VERSION = 'v1' as const;
export const API_BASE_PATH = `/api/${API_VERSION}` as const;

export const API_PATHS = {
  AUTH: {
    SEND_OTP: `${API_BASE_PATH}/auth/send-otp`,
    VERIFY_OTP: `${API_BASE_PATH}/auth/verify-otp`,
    SET_ROLE: `${API_BASE_PATH}/auth/set-role`,
    ME: `${API_BASE_PATH}/auth/me`,
  },
  USER: {
    PROFILE: `${API_BASE_PATH}/user/profile`,
    TOKEN_BALANCE: `${API_BASE_PATH}/user/token-balance`,
    CALL_HISTORY: `${API_BASE_PATH}/user/call-history`,
  },
  TOKENS: {
    PACKS: `${API_BASE_PATH}/tokens/packs`,
    CREATE_ORDER: `${API_BASE_PATH}/tokens/create-order`,
    VERIFY_PAYMENT: `${API_BASE_PATH}/tokens/verify-payment`,
    TRANSACTIONS: `${API_BASE_PATH}/tokens/transactions`,
    DEV_CREDIT: `${API_BASE_PATH}/tokens/dev-credit`,
  },
  CALLS: {
    REQUEST: `${API_BASE_PATH}/calls/request`,
    CANCEL: (id: string): string => `${API_BASE_PATH}/calls/${id}/cancel`,
    STATUS: (id: string): string => `${API_BASE_PATH}/calls/${id}/status`,
    END: (id: string): string => `${API_BASE_PATH}/calls/${id}/end`,
    RATE: (id: string): string => `${API_BASE_PATH}/calls/${id}/rate`,
    REPORT: (id: string): string => `${API_BASE_PATH}/calls/${id}/report`,
  },
  LAWYER: {
    REGISTER: `${API_BASE_PATH}/lawyer/register`,
    PROFILE: `${API_BASE_PATH}/lawyer/profile`,
    TOGGLE_ONLINE: `${API_BASE_PATH}/lawyer/toggle-online`,
    EARNINGS: `${API_BASE_PATH}/lawyer/earnings`,
    PAYOUT_REQUEST: `${API_BASE_PATH}/lawyer/payout-request`,
  },
  SOS: {
    CONTACTS: `${API_BASE_PATH}/sos/contacts`,
    FIRE: `${API_BASE_PATH}/sos/fire`,
  },
  EVIDENCE: {
    UPLOAD: `${API_BASE_PATH}/evidence/upload`,
    DOCUMENTS: `${API_BASE_PATH}/evidence/documents`,
    DELETE: (id: string): string => `${API_BASE_PATH}/evidence/${id}`,
  },
  ADMIN: {
    LAWYERS_PENDING: `${API_BASE_PATH}/admin/lawyers/pending`,
    LAWYER_VERIFY: (id: string): string => `${API_BASE_PATH}/admin/lawyers/${id}/verify`,
    CALLS_AUDIT: `${API_BASE_PATH}/admin/calls/audit`,
    DASHBOARD_STATS: `${API_BASE_PATH}/admin/dashboard/stats`,
  },
} as const;

// =============================================
// WEBSOCKET EVENTS
// =============================================

export const WS_EVENTS = {
  // Client → Server
  LAWYER_GO_ONLINE: 'lawyer:go-online',
  LAWYER_GO_OFFLINE: 'lawyer:go-offline',
  LAWYER_ACCEPT_REQUEST: 'lawyer:accept-request',
  LAWYER_REJECT_REQUEST: 'lawyer:reject-request',
  // Server → Client (to Lawyers)
  CALL_INCOMING: 'call:incoming',
  CALL_CANCELLED: 'call:cancelled',
  // Server → Client (to Users)
  CALL_MATCHED: 'call:matched',
  CALL_NO_LAWYERS: 'call:no-lawyers',
  CALL_LAWYER_CONNECTED: 'call:lawyer-connected',
  CALL_ENDED: 'call:ended',
} as const;

// =============================================
// RECORDING CONFIG
// =============================================

export const RECORDING_CONFIG = {
  RETENTION_DAYS: 90,
  MAX_FILE_SIZE_MB: 50,
} as const;
