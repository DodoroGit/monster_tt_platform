import client from './client'
import type { CoachProfile, CoachAvailability, CoachTitle, ApiResponse } from '@/types'

export const coachesApi = {
  list: () =>
    client.get<ApiResponse<CoachProfile[]>>('/coaches').then((r) => r.data),

  getById: (id: string) =>
    client.get<ApiResponse<CoachProfile>>(`/coaches/${id}`).then((r) => r.data),

  updateMyProfile: (data: { bio?: string; specialty?: string; years_exp?: number; avatar_url?: string }) =>
    client.put<ApiResponse<CoachProfile>>('/coaches/me/profile', data).then((r) => r.data),

  getAvailabilities: (coachId: string, params?: { from?: string; to?: string }) =>
    client
      .get<ApiResponse<CoachAvailability[]>>(`/coaches/${coachId}/availabilities`, { params })
      .then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return client.post<ApiResponse<{ avatar_url: string }>>('/coaches/me/avatar', form).then((r) => r.data)
  },

  addTitle: (title: string) =>
    client.post<ApiResponse<CoachTitle>>('/coaches/me/titles', { title }).then((r) => r.data),

  updateTitle: (titleId: string, title: string) =>
    client.put<ApiResponse<{ message: string }>>(`/coaches/me/titles/${titleId}`, { title }).then((r) => r.data),

  deleteTitle: (titleId: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/coaches/me/titles/${titleId}`).then((r) => r.data),

  reorderTitles: (ids: string[]) =>
    client.patch<ApiResponse<{ message: string }>>('/coaches/me/titles/reorder', { ids }).then((r) => r.data),
}
