import client from './client'
import type { ApiResponse } from '@/types'

export const settingsApi = {
  getTrialPassword: () =>
    client.get<ApiResponse<{ password: string }>>('/settings/trial-password').then((r) => r.data),

  setTrialPassword: (password: string) =>
    client.put<ApiResponse<{ message: string }>>('/settings/trial-password', { password }).then((r) => r.data),
}
