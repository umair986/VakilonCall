// =============================================
// CORE ENTITY INTERFACES
// Matches database schema from TECH_STACK_AND_DEVELOPMENT_PLAN.md Section 4
// =============================================

export interface IUser {
  id: string;
  phone: string;
  full_name: string | null;
  role: UserRole;
  language_pref: LanguageCode;
  token_balance: number;
  is_active: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ILawyerProfile {
  id: string;
  user_id: string;
  bar_enrollment_number: string;
  bar_council_state: string;
  enrollment_cert_url: string;
  id_proof_url: string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  verified_by: string | null;
  is_online: boolean;
  languages: LanguageCode[];
  scenario_tags: ScenarioType[];
  avg_rating: number;
  total_calls: number;
  total_earnings: number;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface IEmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relation: string | null;
  priority: 1 | 2 | 3;
  created_at: string;
}

export interface ITokenPack {
  id: string;
  name: TokenPackName;
  tokens: number;
  price_inr: number;
  is_active: boolean;
  created_at: string;
}

export interface ITokenTransaction {
  id: string;
  user_id: string;
  type: TokenTransactionType;
  tokens: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  token_pack_id: string | null;
  call_session_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ICallSession {
  id: string;
  user_id: string;
  lawyer_id: string | null;
  scenario: ScenarioType;
  status: CallStatus;
  exotel_call_sid: string | null;
  recording_url: string | null;
  recording_duration_sec: number | null;
  tokens_charged: number;
  lawyer_payout: number;
  platform_revenue: number;
  user_latitude: number | null;
  user_longitude: number | null;
  sos_fired: boolean;
  started_at: string | null;
  connected_at: string | null;
  ended_at: string | null;
  end_reason: CallEndReason | null;
  created_at: string;
}

export interface IRating {
  id: string;
  call_session_id: string;
  user_id: string;
  lawyer_id: string;
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  is_reported: boolean;
  report_reason: string | null;
  created_at: string;
}

export interface ISosAlert {
  id: string;
  user_id: string;
  call_session_id: string | null;
  latitude: number;
  longitude: number;
  contacts_notified: ISosContactResult[];
  officer_name: string | null;
  officer_badge: string | null;
  fired_at: string;
}

export interface ISosContactResult {
  name: string;
  phone: string;
  sms_status: 'sent' | 'failed' | 'pending';
}

export interface IEvidenceDocument {
  id: string;
  user_id: string;
  doc_type: EvidenceDocType;
  file_url: string;
  file_name: string | null;
  is_encrypted: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ILawyerPayout {
  id: string;
  lawyer_id: string;
  amount: number;
  status: PayoutStatus;
  razorpay_payout_id: string | null;
  bank_account: IBankAccount | null;
  upi_id: string | null;
  requested_at: string;
  processed_at: string | null;
}

export interface IBankAccount {
  ifsc: string;
  account_number: string;
  name: string;
}

// =============================================
// ENUM / LITERAL TYPES
// =============================================

export type UserRole = 'user' | 'lawyer';

export type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'bn' | 'mr';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type ScenarioType =
  | 'traffic_stop'
  | 'fir_refusal'
  | 'custodial_arrest'
  | 'domestic_dispute'
  | 'digital_scam'
  | 'workplace_raid'
  | 'eviction'
  | 'consumer'
  | 'other';

export type CallStatus =
  | 'matching'
  | 'lawyer_accepted'
  | 'in_call'
  | 'completed'
  | 'dropped'
  | 'cancelled'
  | 'no_lawyers';

export type CallEndReason =
  | 'user_ended'
  | 'lawyer_ended'
  | 'time_limit'
  | 'dropped'
  | 'cancelled';

export type TokenPackName = 'Starter' | 'Basic' | 'Standard' | 'Premium';

export type TokenTransactionType = 'purchase' | 'deduct' | 'refund' | 'promo';

export type EvidenceDocType =
  | 'aadhaar'
  | 'driving_license'
  | 'rc_book'
  | 'vehicle_insurance'
  | 'puc_certificate'
  | 'encounter_photo'
  | 'encounter_audio'
  | 'other';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

// =============================================
// API RESPONSE TYPES
// =============================================

export interface IApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: IApiPaginationMeta;
}

export interface IApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
  };
}

export type IApiResponse<T> = IApiSuccessResponse<T> | IApiErrorResponse;

export interface IApiPaginationMeta {
  page: number;
  limit: number;
  total: number;
}

// =============================================
// WEBSOCKET EVENT PAYLOADS
// =============================================

export interface ICallIncomingPayload {
  call_session_id: string;
  scenario: ScenarioType;
  language: LanguageCode;
  user_location: {
    latitude: number;
    longitude: number;
  } | null;
}

export interface ICallMatchedPayload {
  call_session_id: string;
  lawyer_name: string;
  lawyer_rating: number;
}

export interface ICallEndedPayload {
  call_session_id: string;
  duration_sec: number;
  summary: {
    tokens_charged: number;
    scenario: ScenarioType;
  };
}

// =============================================
// ERROR CODE TYPE
// =============================================

export type ErrorCode =
  | 'AUTH_INVALID_OTP'
  | 'AUTH_EXPIRED_OTP'
  | 'AUTH_PHONE_REQUIRED'
  | 'AUTH_UNAUTHORIZED'
  | 'USER_NOT_FOUND'
  | 'USER_BANNED'
  | 'LAWYER_NOT_VERIFIED'
  | 'LAWYER_ALREADY_ONLINE'
  | 'LAWYER_OFFLINE'
  | 'TOKEN_INSUFFICIENT'
  | 'TOKEN_PACK_NOT_FOUND'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_SIGNATURE_INVALID'
  | 'CALL_NOT_FOUND'
  | 'CALL_ALREADY_MATCHED'
  | 'CALL_NO_LAWYERS_AVAILABLE'
  | 'CALL_ALREADY_ENDED'
  | 'CALL_DROP_REFUND_ISSUED'
  | 'SOS_NO_CONTACTS'
  | 'SOS_SEND_FAILED'
  | 'EVIDENCE_UPLOAD_FAILED'
  | 'EVIDENCE_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'VALIDATION_ERROR';
