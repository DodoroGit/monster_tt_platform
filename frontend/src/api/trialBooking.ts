import client from './client'
import type { TrialBooking, ApiResponse } from '@/types'

export const trialBookingApi = {
  create: (data: {
    availability_id: string
    booking_start: string
    guest_name: string
    guest_phone: string
    password: string
  }) =>
    client.post<ApiResponse<TrialBooking>>('/trial-bookings', data).then((r) => r.data),

  listAll: () =>
    client.get<ApiResponse<TrialBooking[]>>('/trial-bookings').then((r) => r.data),

  listMine: () =>
    client.get<ApiResponse<TrialBooking[]>>('/trial-bookings/me').then((r) => r.data),

  approve: (id: string) =>
    client.patch<ApiResponse<{ message: string }>>(`/trial-bookings/${id}/approve`).then((r) => r.data),

  reject: (id: string) =>
    client.patch<ApiResponse<{ message: string }>>(`/trial-bookings/${id}/reject`).then((r) => r.data),

  delete: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/trial-bookings/${id}`).then((r) => r.data),

  cancel: (id: string) =>
    client.patch<ApiResponse<{ message: string }>>(`/trial-bookings/${id}/cancel`).then((r) => r.data),

  approveCancel: (id: string) =>
    client.patch<ApiResponse<{ message: string }>>(`/trial-bookings/${id}/approve-cancel`).then((r) => r.data),

  rejectCancel: (id: string) =>
    client.patch<ApiResponse<{ message: string }>>(`/trial-bookings/${id}/reject-cancel`).then((r) => r.data),
}
