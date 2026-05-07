'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import axios from 'axios';
import type {
  CurrentUserDto,
  InitiateRegisterDto,
  LoginDto,
  RegisterDto,
  RequestPasswordResetDto,
  ResendRegisterOtpDto,
  ResetPasswordDto,
  VerifyRegisterDto,
} from '@beauty-diary/shared';
import { api } from '@/lib/api';

export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'currentUser'] as const,
};

/**
 * Returns the logged-in user, or `null` if anonymous.
 * 401 from `/auth/me` is the normal "not signed in" signal — not an error.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async (): Promise<CurrentUserDto | null> => {
      try {
        const res = await api.get<CurrentUserDto>('/api/auth/me');
        return res.data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useLogin(): UseMutationResult<{ id: string }, unknown, LoginDto> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      const res = await api.post<{ id: string }>('/api/auth/login', input);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: authKeys.currentUser() });
    },
  });
}

export function useRegister(): UseMutationResult<{ id: string }, unknown, RegisterDto> {
  // Legacy single-step register, kept for any callers/tests that still use it.
  // The user-facing flow goes through useInitiateRegister + useVerifyRegister.
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      const res = await api.post<{ id: string }>('/api/auth/register', input);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: authKeys.currentUser() });
    },
  });
}

export function useInitiateRegister(): UseMutationResult<void, unknown, InitiateRegisterDto> {
  return useMutation({
    mutationFn: async (input) => {
      await api.post('/api/auth/register/initiate', input);
    },
  });
}

export function useVerifyRegister(): UseMutationResult<{ id: string }, unknown, VerifyRegisterDto> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      const res = await api.post<{ id: string }>('/api/auth/register/verify', input);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: authKeys.currentUser() });
    },
  });
}

export function useResendRegisterOtp(): UseMutationResult<void, unknown, ResendRegisterOtpDto> {
  return useMutation({
    mutationFn: async (input) => {
      await api.post('/api/auth/register/resend', input);
    },
  });
}

export function useLogout(): UseMutationResult<void, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/logout');
    },
    onSuccess: () => {
      qc.setQueryData(authKeys.currentUser(), null);
      qc.invalidateQueries();
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (input: RequestPasswordResetDto) => {
      await api.post('/api/auth/password/request-reset', input);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: ResetPasswordDto) => {
      await api.post('/api/auth/password/reset', input);
    },
  });
}
