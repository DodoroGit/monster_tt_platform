import client from './client'
import type { Award, ApiResponse } from '@/types'

export const awardsApi = {
  list: () =>
    client.get<ApiResponse<Award[]>>('/awards').then((r) => r.data),

  create: (data: { year: string; title: string }) =>
    client.post<ApiResponse<Award>>('/awards', data).then((r) => r.data),

  delete: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/awards/${id}`).then((r) => r.data),
}
