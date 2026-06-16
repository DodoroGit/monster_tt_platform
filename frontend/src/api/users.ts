import client from './client'
import type { User, ApiResponse } from '@/types'

export const usersApi = {
  list: () =>
    client.get<ApiResponse<User[]>>('/users').then((r) => r.data),

  create: (data: { name: string; phone: string; role: string }) =>
    client.post<ApiResponse<User>>('/users', data).then((r) => r.data),

  patchRole: (id: string, role: string) =>
    client.patch<ApiResponse<{ message: string }>>(`/users/${id}/role`, { role }).then((r) => r.data),

  updateMyProfile: (data: { email?: string; line_id?: string; birthday?: string | null; gender?: string }) =>
    client.put<ApiResponse<User>>('/users/me', data).then((r) => r.data),

  updateByOwner: (id: string, data: { name?: string; phone?: string; email?: string; line_id?: string; birthday?: string | null; gender?: string }) =>
    client.put<ApiResponse<User>>(`/users/${id}`, data).then((r) => r.data),
}
