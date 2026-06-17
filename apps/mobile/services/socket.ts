import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { getApiBaseUrl } from './api';

let socket: Socket | null = null;

/**
 * Initialize the Socket.io connection with the current auth token.
 * Should be called once after the user is authenticated.
 */
export function connectSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const token = useAuthStore.getState().accessToken;

  socket = io(getApiBaseUrl(), {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  return socket;
}

/**
 * Returns the current socket instance. Returns null if not connected.
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect the socket. Call on logout.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

// ==============================================
// Lawyer-specific socket events
// ==============================================

export function emitLawyerGoOnline(): void {
  socket?.emit('lawyer:go-online');
}

export function emitLawyerGoOffline(): void {
  socket?.emit('lawyer:go-offline');
}

export function emitLawyerAcceptRequest(callSessionId: string): void {
  socket?.emit('lawyer:accept-request', { call_session_id: callSessionId });
}

export function emitLawyerRejectRequest(callSessionId: string): void {
  socket?.emit('lawyer:reject-request', { call_session_id: callSessionId });
}

// ==============================================
// Listener helpers (type-safe event handlers)
// ==============================================

export interface IIncomingCallEvent {
  call_session_id: string;
  scenario: string;
  language: string;
  user_location: { latitude: number; longitude: number } | null;
}

export interface ICallMatchedEvent {
  call_session_id: string;
  lawyer_name: string;
  lawyer_rating: number;
}

export interface ICallEndedEvent {
  call_session_id: string;
  duration: number;
  summary: string;
}

export function onIncomingCall(
  callback: (data: IIncomingCallEvent) => void
): void {
  socket?.on('call:incoming', callback);
}

export function onCallCancelled(
  callback: (data: { call_session_id: string }) => void
): void {
  socket?.on('call:cancelled', callback);
}

export function onCallMatched(
  callback: (data: ICallMatchedEvent) => void
): void {
  socket?.on('call:matched', callback);
}

export function onNoLawyers(
  callback: (data: { call_session_id: string }) => void
): void {
  socket?.on('call:no-lawyers', callback);
}

export function onLawyerConnected(
  callback: (data: { exotel_call_url: string }) => void
): void {
  socket?.on('call:lawyer-connected', callback);
}

export function onCallEnded(
  callback: (data: ICallEndedEvent) => void
): void {
  socket?.on('call:ended', callback);
}
