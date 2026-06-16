import client from './client'
import type { Order, ApiResponse } from '@/types'

export const ordersApi = {
  create: (items: { product_id: string; quantity: number }[]) =>
    client.post<ApiResponse<Order>>('/orders', { items }).then((r) => r.data),

  listMine: () =>
    client.get<ApiResponse<Order[]>>('/orders/me').then((r) => r.data),

  listAll: () =>
    client.get<ApiResponse<Order[]>>('/orders').then((r) => r.data),

  patchStatus: (id: string, status: string) =>
    client.patch<ApiResponse<{ message: string }>>(`/orders/${id}/status`, { status }).then((r) => r.data),

  delete: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/orders/${id}`).then((r) => r.data),
}
