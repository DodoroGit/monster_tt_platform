export type UserRole = 'owner' | 'coach' | 'customer'

export interface User {
  id: string
  name: string
  phone: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface CoachTitle {
  id: string
  profile_id: string
  title: string
  sort_order: number
  created_at: string
}

export interface CoachProfile {
  id: string
  user_id: string
  user: User
  bio: string
  specialty: string
  years_exp: number
  titles: CoachTitle[]
  avatar_url: string
  created_at: string
}

export type AvailabilityStatus = 'available' | 'booked' | 'cancelled'

export interface CoachAvailability {
  id: string
  coach_id: string
  start_time: string
  end_time: string
  status: AvailabilityStatus
  bookings?: Booking[]
  trial_bookings?: TrialBooking[]
  created_at: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancel_requested' | 'cancelled' | 'completed'

export interface Booking {
  id: string
  availability_id: string
  availability: CoachAvailability
  customer_id: string
  customer: User
  coach_id: string
  coach: User
  status: BookingStatus
  previous_status?: BookingStatus
  booking_start: string
  booking_end: string
  note: string
  created_at: string
  updated_at: string
}

export type ProductStatus = 'on_shelf' | 'off_shelf'

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  sort_order: number
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  status: ProductStatus
  images: ProductImage[]
  created_at: string
}

export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled'

export interface OrderItem {
  id: string
  product_id: string
  product: Product
  quantity: number
  unit_price: number
}

export interface Order {
  id: string
  customer_id: string
  customer?: User
  total_amount: number
  status: OrderStatus
  items: OrderItem[]
  created_at: string
}

export interface ApiResponse<T> {
  data: T
  error: { code: string; message: string } | null
}

export interface CartItem {
  product: Product
  quantity: number
}

export type TrialBookingStatus = 'pending' | 'approved' | 'rejected' | 'cancel_requested' | 'cancelled'

export interface TrialBooking {
  id: string
  availability_id: string
  availability: CoachAvailability
  coach_id: string
  coach: User
  guest_name: string
  guest_phone: string
  booking_start: string
  booking_end: string
  status: TrialBookingStatus
  created_at: string
  updated_at: string
}

export interface Award {
  id: string
  year: string
  title: string
  sort_order: number
  created_at: string
  updated_at: string
}
