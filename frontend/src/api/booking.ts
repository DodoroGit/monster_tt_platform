import client from './client'
import type { Booking, CoachAvailability, ApiResponse } from '@/types'

export const bookingApi = {
  create: (data: { availability_id: string; booking_start: string; booking_end?: string; note?: string }) =>
    client.post<ApiResponse<Booking>>('/bookings', data).then((r) => r.data),

  listMine: () =>
    client.get<ApiResponse<Booking[]>>('/bookings/me').then((r) => r.data),

  cancel: (id: string) =>
    client.patch<ApiResponse<{ message: string }>>(`/bookings/${id}/cancel`).then((r) => r.data),

  approve: (id: string) =>
    client.patch<ApiResponse<{ message: string }>>(`/bookings/${id}/approve`).then((r) => r.data),

  reject: (id: string) =>
    client.patch<ApiResponse<{ message: string }>>(`/bookings/${id}/reject`).then((r) => r.data),

  approveCancel: (id: string) =>
    client.patch<ApiResponse<{ message: string }>>(`/bookings/${id}/approve-cancel`).then((r) => r.data),

  rejectCancel: (id: string) =>
    client.patch<ApiResponse<{ message: string }>>(`/bookings/${id}/reject-cancel`).then((r) => r.data),

  listAvailabilities: (coachId: string) =>
    client.get<ApiResponse<CoachAvailability[]>>(`/coaches/${coachId}/availabilities`).then((r) => r.data),

  createAvailability: (data: { start_time: string; end_time: string }) =>
    client.post<ApiResponse<CoachAvailability>>('/availabilities', data).then((r) => r.data),

  listMyAvailabilities: () =>
    client.get<ApiResponse<CoachAvailability[]>>('/availabilities/me').then((r) => r.data),

  listCoachAvailabilities: (coachId: string) =>
    client.get<ApiResponse<CoachAvailability[]>>(`/availabilities?coach_id=${coachId}`).then((r) => r.data),

  createAvailabilityForCoach: (data: { start_time: string; end_time: string; coach_id: string }) =>
    client.post<ApiResponse<CoachAvailability>>('/availabilities', data).then((r) => r.data),

  deleteAvailability: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/availabilities/${id}`).then((r) => r.data),

  listAll: () =>
    client.get<ApiResponse<Booking[]>>('/bookings').then((r) => r.data),

  deleteBooking: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/bookings/${id}`).then((r) => r.data),
}
