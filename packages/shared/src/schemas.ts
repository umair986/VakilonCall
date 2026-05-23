import { z } from 'zod';

// =============================================
// PHONE NUMBER VALIDATION (India: +91)
// =============================================

const phoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number. Format: +91XXXXXXXXXX');

// =============================================
// AUTH SCHEMAS
// =============================================

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
});

export const setRoleSchema = z.object({
  role: z.enum(['user', 'lawyer']),
});

// =============================================
// USER SCHEMAS
// =============================================

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  language_pref: z.enum(['en', 'hi', 'ta', 'te', 'kn', 'bn', 'mr']).optional(),
});

// =============================================
// LAWYER SCHEMAS
// =============================================

export const lawyerRegisterSchema = z.object({
  bar_enrollment_number: z
    .string()
    .min(5, 'Bar enrollment number is required')
    .max(50),
  bar_council_state: z.string().min(2).max(50),
  // File URLs are set server-side after upload
});

export const updateLawyerProfileSchema = z.object({
  languages: z
    .array(z.enum(['en', 'hi', 'ta', 'te', 'kn', 'bn', 'mr']))
    .min(1, 'At least one language required')
    .optional(),
  scenario_tags: z
    .array(
      z.enum([
        'traffic_stop', 'fir_refusal', 'custodial_arrest',
        'domestic_dispute', 'digital_scam', 'workplace_raid',
        'eviction', 'consumer', 'other',
      ])
    )
    .optional(),
});

export const toggleOnlineSchema = z.object({
  is_online: z.boolean(),
});

// =============================================
// TOKEN SCHEMAS
// =============================================

export const createTokenOrderSchema = z.object({
  pack_id: z.string().uuid('Invalid pack ID'),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// =============================================
// CALL SCHEMAS
// =============================================

export const callRequestSchema = z.object({
  scenario: z.enum([
    'traffic_stop', 'fir_refusal', 'custodial_arrest',
    'domestic_dispute', 'digital_scam', 'workplace_raid',
    'eviction', 'consumer', 'other',
  ]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const endCallSchema = z.object({
  pin: z.string().length(4, 'PIN must be 4 digits').regex(/^\d{4}$/, 'PIN must be numeric'),
});

export const rateCallSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const reportCallSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason').max(1000),
});

// =============================================
// SOS SCHEMAS
// =============================================

export const sosContactsSchema = z.object({
  contacts: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        phone: phoneSchema,
        relation: z.string().max(50).optional(),
      })
    )
    .min(1, 'At least one emergency contact required')
    .max(3, 'Maximum 3 emergency contacts'),
});

export const sosFireSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  officer_name: z.string().max(100).optional(),
  officer_badge: z.string().max(50).optional(),
});

// =============================================
// EVIDENCE SCHEMAS
// =============================================

export const evidenceUploadSchema = z.object({
  doc_type: z.enum([
    'aadhaar', 'driving_license', 'rc_book',
    'vehicle_insurance', 'puc_certificate',
    'encounter_photo', 'encounter_audio', 'other',
  ]),
});

// =============================================
// ADMIN SCHEMAS
// =============================================

export const verifyLawyerSchema = z.object({
  status: z.enum(['verified', 'rejected']),
});

// =============================================
// PAGINATION SCHEMA
// =============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// =============================================
// LAWYER PAYOUT SCHEMA
// =============================================

export const payoutRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  upi_id: z.string().optional(),
  bank_account: z
    .object({
      ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
      account_number: z.string().min(9).max(18),
      name: z.string().min(2).max(100),
    })
    .optional(),
}).refine(
  (data) => data.upi_id || data.bank_account,
  { message: 'Either UPI ID or bank account is required' }
);

// =============================================
// INFERRED TYPES (for use in controllers)
// =============================================

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type SetRoleInput = z.infer<typeof setRoleSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type LawyerRegisterInput = z.infer<typeof lawyerRegisterSchema>;
export type UpdateLawyerProfileInput = z.infer<typeof updateLawyerProfileSchema>;
export type ToggleOnlineInput = z.infer<typeof toggleOnlineSchema>;
export type CreateTokenOrderInput = z.infer<typeof createTokenOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CallRequestInput = z.infer<typeof callRequestSchema>;
export type EndCallInput = z.infer<typeof endCallSchema>;
export type RateCallInput = z.infer<typeof rateCallSchema>;
export type ReportCallInput = z.infer<typeof reportCallSchema>;
export type SosContactsInput = z.infer<typeof sosContactsSchema>;
export type SosFireInput = z.infer<typeof sosFireSchema>;
export type EvidenceUploadInput = z.infer<typeof evidenceUploadSchema>;
export type VerifyLawyerInput = z.infer<typeof verifyLawyerSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;
