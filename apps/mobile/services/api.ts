import { API_PATHS } from '@vakiloncall/shared';
import type { IApiResponse } from '@vakiloncall/shared';
import { useAuthStore } from '../stores/authStore';
import Constants from 'expo-constants';

const API_BASE_URL =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)?.API_BASE_URL ??
  'http://localhost:3000';

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

  // Lawyer
  getLawyerProfile: () =>
    request<Record<string, unknown>>('GET', API_PATHS.LAWYER.PROFILE),

  toggleOnline: (is_online: boolean) =>
    request<{ is_online: boolean }>(
      'POST', API_PATHS.LAWYER.TOGGLE_ONLINE, { is_online }
    ),
};
