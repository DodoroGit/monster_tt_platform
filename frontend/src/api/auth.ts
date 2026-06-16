import client from './client'
import type { User, ApiResponse } from '@/types'

export const authApi = {
  register: (data: { name: string; phone: string }) =>
    client.post<ApiResponse<User>>('/auth/register', data).then((r) => r.data),

  login: (data: { name: string; phone: string }) =>
    client.post<ApiResponse<{ token: string; user: User }>>('/auth/login', data).then((r) => r.data),

  me: () =>
    client.get<ApiResponse<User>>('/auth/me').then((r) => r.data),
}
