import { API_PATHS } from '@vakiloncall/shared';
import type { IApiResponse } from '@vakiloncall/shared';
import { useAuthStore } from '../stores/authStore';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getApiBaseUrl(): string {
  // If explicitly configured via app.json extra, use that
  const configuredUrl =
    (Constants.expoConfig?.extra as Record<string, string> | undefined)?.API_BASE_URL;
  if (configuredUrl) return configuredUrl;

  // In development, derive the backend URL from Expo's dev server host.
  // The debuggerHost is something like "192.168.0.103:8082" — we strip the
  // metro port and replace it with the backend port (3000).
  if (__DEV__) {
    const debuggerHost =
      Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      return `http://${host}:3000`;
    }
  }

  // Fallback (simulators, web, or production)
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000'; // Android emulator special IP
  }
  return 'http://localhost:3000';
}

const API_BASE_URL = getApiBaseUrl();


type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<IApiResponse<T>> {
  const token = useAuthStore.getState().accessToken;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, config);
    const data = (await response.json()) as IApiResponse<T>;
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Network error. Please check your connection.',
      },
    };
  }
}

// Typed API methods matching the exact endpoints from the plan
export const api = {
  // Auth
  sendOtp: (phone: string) =>
    request<{ message: string; phone: string }>(
      'POST', API_PATHS.AUTH.SEND_OTP, { phone }
    ),

  verifyOtp: (phone: string, otp: string) =>
    request<{
      access_token: string;
      refresh_token: string;
      user: Record<string, unknown> | null;
      is_new_user: boolean;
    }>('POST', API_PATHS.AUTH.VERIFY_OTP, { phone, otp }),

  setRole: (role: 'user' | 'lawyer') =>
    request<{ id: string; phone: string; role: string }>(
      'POST', API_PATHS.AUTH.SET_ROLE, { role }
    ),

  getMe: () =>
    request<Record<string, unknown>>('GET', API_PATHS.AUTH.ME),

  // User
  getProfile: () =>
    request<Record<string, unknown>>('GET', API_PATHS.USER.PROFILE),

  updateProfile: (data: { full_name?: string; language_pref?: string }) =>
    request<Record<string, unknown>>('PATCH', API_PATHS.USER.PROFILE, data),

  getTokenBalance: () =>
    request<{ token_balance: number }>('GET', API_PATHS.USER.TOKEN_BALANCE),

  // Tokens
  getTokenPacks: () =>
    request<Array<{ id: string; name: string; tokens: number; price_inr: number }>>(
      'GET', API_PATHS.TOKENS.PACKS
    ),

  createTokenOrder: (pack_id: string) =>
    request<{
      order_id: string;
      amount: number;
      currency: string;
      pack_name: string;
      tokens: number;
      razorpay_key_id: string;
    }>('POST', API_PATHS.TOKENS.CREATE_ORDER, { pack_id }),

  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    request<{ token_balance: number; tokens_added: number; transaction_id: string }>(
      'POST', API_PATHS.TOKENS.VERIFY_PAYMENT, data
    ),

  getTokenTransactions: (page = 1, limit = 20) =>
    request<
      Array<{
        id: string;
        type: 'purchase' | 'deduct' | 'refund' | 'promo';
        tokens: number;
        created_at: string;
        metadata: Record<string, unknown>;
      }>
    >('GET', `${API_PATHS.TOKENS.TRANSACTIONS}?page=${page}&limit=${limit}`),

  devCreditTokens: (pack_id: string) =>
    request<{ token_balance: number; tokens_added: number; transaction_id: string }>(
      'POST', API_PATHS.TOKENS.DEV_CREDIT, { pack_id }
    ),

  // Lawyer
  getLawyerProfile: () =>
    request<Record<string, unknown>>('GET', API_PATHS.LAWYER.PROFILE),

  toggleOnline: (is_online: boolean) =>
    request<{ is_online: boolean }>(
      'POST', API_PATHS.LAWYER.TOGGLE_ONLINE, { is_online }
    ),

  registerLawyer: async (formData: FormData) => {
    const token = useAuthStore.getState().accessToken;

    try {
      const response = await fetch(`${API_BASE_URL}${API_PATHS.LAWYER.REGISTER}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      return (await response.json()) as IApiResponse<{
        id: string;
        bar_enrollment_number: string;
        bar_council_state: string;
        verification_status: string;
        message: string;
      }>;
    } catch {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Network error. Please check your connection.',
        },
      };
    }
  },

  // Calls
  requestCall: (scenario: string, latitude?: number, longitude?: number) =>
    request<{
      call_session_id: string;
      status: string;
      scenario: string;
      message: string;
    }>('POST', API_PATHS.CALLS.REQUEST, { scenario, latitude, longitude }),

  cancelCall: (callId: string) =>
    request<{ status: string }>(
      'POST', API_PATHS.CALLS.CANCEL(callId)
    ),

  getCallStatus: (callId: string) =>
    request<{
      id: string;
      status: string;
      scenario: string;
      lawyer_name: string | null;
      tokens_charged: number;
    }>('GET', API_PATHS.CALLS.STATUS(callId)),

  endCall: (callId: string) =>
    request<{
      status: string;
      duration_sec: number;
      tokens_charged: number;
      refunded: boolean;
    }>('POST', API_PATHS.CALLS.END(callId)),

  rateCall: (callId: string, stars: number, comment?: string) =>
    request<{ message: string; stars: number }>(
      'POST', API_PATHS.CALLS.RATE(callId), { stars, comment }
    ),

  reportCall: (callId: string, reason: string) =>
    request<{ message: string }>(
      'POST', API_PATHS.CALLS.REPORT(callId), { reason }
    ),

  // SOS
  getSosContacts: () =>
    request<
      Array<{
        id: string;
        name: string;
        phone: string;
        relation: string | null;
        priority: number;
      }>
    >('GET', API_PATHS.SOS.CONTACTS),

  setSosContacts: (contacts: Array<{ name: string; phone: string; relation?: string }>) =>
    request<
      Array<{
        id: string;
        name: string;
        phone: string;
        relation: string | null;
        priority: number;
      }>
    >('PUT', API_PATHS.SOS.CONTACTS, { contacts }),

  fireSos: (data: { latitude: number; longitude: number; officer_name?: string; officer_badge?: string }) =>
    request<{
      id: string;
      contacts_notified: number;
      contacts: Array<{ name: string; phone: string; sms_status: string }>;
      message: string;
    }>('POST', API_PATHS.SOS.FIRE, data),
};
