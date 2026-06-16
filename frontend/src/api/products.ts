import client from './client'
import type { Product, ProductImage, ApiResponse } from '@/types'

export const productsApi = {
  list: (all = false) =>
    client.get<ApiResponse<Product[]>>('/products', { params: all ? { all: 'true' } : undefined }).then((r) => r.data),

  getById: (id: string) =>
    client.get<ApiResponse<Product>>(`/products/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string; price: number; stock: number }) =>
    client.post<ApiResponse<Product>>('/products', data).then((r) => r.data),

  update: (id: string, data: Partial<{ name: string; description: string; price: number; stock: number }>) =>
    client.put<ApiResponse<Product>>(`/products/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/products/${id}`).then((r) => r.data),

  patchStatus: (id: string, status: 'on_shelf' | 'off_shelf') =>
    client.patch<ApiResponse<{ message: string }>>(`/products/${id}/status`, { status }).then((r) => r.data),

  uploadImage: (id: string, file: File) => {
    const form = new FormData()
    form.append('image', file)
    return client.post<ApiResponse<ProductImage>>(`/products/${id}/images`, form).then((r) => r.data)
  },

  deleteImage: (productId: string, imageId: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/products/${productId}/images/${imageId}`).then((r) => r.data),
}
