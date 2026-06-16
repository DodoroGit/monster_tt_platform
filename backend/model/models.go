package model

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTClaims struct {
	UserID uuid.UUID `json:"user_id"`
	Role   string    `json:"role"`
	jwt.RegisteredClaims
}

// ── Domain models ─────────────────────────────────────────────────────────────

type UserRole string

const (
	RoleOwner    UserRole = "owner"
	RoleCoach    UserRole = "coach"
	RoleCustomer UserRole = "customer"
)

type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Phone     string    `gorm:"uniqueIndex;not null" json:"phone"`
	Role      UserRole  `gorm:"type:varchar(20);not null;default:'customer'" json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CoachProfile struct {
	ID                uuid.UUID    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID            uuid.UUID    `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	User              User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Bio               string       `gorm:"type:text" json:"bio"`
	Specialty         string       `json:"specialty"`
	YearsExp          int          `json:"years_exp"`
	Titles            []CoachTitle `gorm:"foreignKey:ProfileID;constraint:OnDelete:CASCADE" json:"titles,omitempty"`
	AvatarURL         string       `json:"avatar_url"`
	AvatarData        []byte       `gorm:"type:bytea" json:"-"`
	AvatarContentType string       `gorm:"default:'image/jpeg'" json:"-"`
	CreatedAt         time.Time    `json:"created_at"`
	UpdatedAt         time.Time    `json:"updated_at"`
}

type CoachTitle struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ProfileID uuid.UUID `gorm:"type:uuid;not null;index" json:"profile_id"`
	Title     string    `gorm:"not null" json:"title"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
}

type AvailabilityStatus string

const (
	AvailabilityAvailable AvailabilityStatus = "available"
	AvailabilityBooked    AvailabilityStatus = "booked"
	AvailabilityCancelled AvailabilityStatus = "cancelled"
)

type CoachAvailability struct {
	ID            uuid.UUID          `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CoachID       uuid.UUID          `gorm:"type:uuid;not null;index" json:"coach_id"`
	Coach         User               `gorm:"foreignKey:CoachID" json:"coach,omitempty"`
	StartTime     time.Time          `gorm:"not null" json:"start_time"`
	EndTime       time.Time          `gorm:"not null" json:"end_time"`
	Status        AvailabilityStatus `gorm:"type:varchar(20);not null;default:'available'" json:"status"`
	Bookings      []Booking          `gorm:"foreignKey:AvailabilityID" json:"bookings,omitempty"`
	TrialBookings []TrialBooking     `gorm:"foreignKey:AvailabilityID" json:"trial_bookings,omitempty"`
	CreatedAt     time.Time          `json:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at"`
}

type BookingStatus string

const (
	BookingPending          BookingStatus = "pending"
	BookingConfirmed        BookingStatus = "confirmed"
	BookingCancelRequested  BookingStatus = "cancel_requested"
	BookingCancelled        BookingStatus = "cancelled"
	BookingCompleted        BookingStatus = "completed"
)

type Booking struct {
	ID             uuid.UUID         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AvailabilityID uuid.UUID         `gorm:"type:uuid;index;not null" json:"availability_id"`
	Availability   CoachAvailability `gorm:"foreignKey:AvailabilityID" json:"availability,omitempty"`
	CustomerID     uuid.UUID         `gorm:"type:uuid;not null;index" json:"customer_id"`
	Customer       User              `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	CoachID        uuid.UUID         `gorm:"type:uuid;not null;index" json:"coach_id"`
	Coach          User              `gorm:"foreignKey:CoachID" json:"coach,omitempty"`
	Status         BookingStatus     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	PreviousStatus *BookingStatus    `gorm:"type:varchar(20)" json:"previous_status,omitempty"`
	BookingStart   time.Time         `gorm:"not null" json:"booking_start"`
	BookingEnd     time.Time         `gorm:"not null" json:"booking_end"`
	Note           string            `gorm:"type:text" json:"note"`
	CreatedAt      time.Time         `json:"created_at"`
	UpdatedAt      time.Time         `json:"updated_at"`
}

type ProductStatus string

const (
	ProductOnShelf  ProductStatus = "on_shelf"
	ProductOffShelf ProductStatus = "off_shelf"
)

type Product struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	Price       float64        `gorm:"type:numeric(10,2);not null" json:"price"`
	Stock       int            `gorm:"not null;default:0" json:"stock"`
	Status      ProductStatus  `gorm:"type:varchar(20);not null;default:'off_shelf'" json:"status"`
	CreatedBy   uuid.UUID      `gorm:"type:uuid;not null" json:"created_by"`
	Images      []ProductImage `gorm:"foreignKey:ProductID" json:"images,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

type ProductImage struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ProductID   uuid.UUID `gorm:"type:uuid;not null;index" json:"product_id"`
	ImageData   []byte    `gorm:"type:bytea;not null" json:"-"`
	ContentType string    `gorm:"not null;default:'image/jpeg'" json:"content_type"`
	SortOrder   int       `gorm:"default:0" json:"sort_order"`
	ImageURL    string    `gorm:"not null;default:''" json:"image_url"`
	CreatedAt   time.Time `json:"created_at"`
}

type OrderStatus string

const (
	OrderPending   OrderStatus = "pending"
	OrderPaid      OrderStatus = "paid"
	OrderCompleted OrderStatus = "completed"
	OrderCancelled OrderStatus = "cancelled"
)

type Order struct {
	ID          uuid.UUID   `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CustomerID  uuid.UUID   `gorm:"type:uuid;not null;index" json:"customer_id"`
	Customer    User        `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	TotalAmount float64     `gorm:"type:numeric(10,2);not null" json:"total_amount"`
	Status      OrderStatus `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	Items       []OrderItem `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

type OrderItem struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	OrderID   uuid.UUID `gorm:"type:uuid;not null;index" json:"order_id"`
	ProductID uuid.UUID `gorm:"type:uuid;not null" json:"product_id"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Quantity  int       `gorm:"not null" json:"quantity"`
	UnitPrice float64   `gorm:"type:numeric(10,2);not null" json:"unit_price"`
	CreatedAt time.Time `json:"created_at"`
}

// ── Request / Response DTOs ───────────────────────────────────────────────────

type RegisterReq struct {
	Name  string `json:"name" binding:"required"`
	Phone string `json:"phone" binding:"required"`
}

type LoginReq struct {
	Name  string `json:"name" binding:"required"`
	Phone string `json:"phone" binding:"required"`
}

type LoginResp struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

type CreateUserReq struct {
	Name  string `json:"name" binding:"required"`
	Phone string `json:"phone" binding:"required"`
	Role  string `json:"role" binding:"required,oneof=owner coach customer"`
}

type PatchRoleReq struct {
	Role string `json:"role" binding:"required,oneof=owner coach customer"`
}

type UpdateProfileReq struct {
	Bio       string `json:"bio"`
	Specialty string `json:"specialty"`
	YearsExp  int    `json:"years_exp"`
	AvatarURL string `json:"avatar_url"`
}

type CreateAvailabilityReq struct {
	StartTime time.Time  `json:"start_time" binding:"required"`
	EndTime   time.Time  `json:"end_time" binding:"required"`
	CoachID   *uuid.UUID `json:"coach_id"` // 店長代建時指定教練
}

type CreateBookingReq struct {
	AvailabilityID uuid.UUID  `json:"availability_id" binding:"required"`
	BookingStart   time.Time  `json:"booking_start" binding:"required"`
	BookingEnd     *time.Time `json:"booking_end"` // 若不傳則預設 +1 小時
	Note           string     `json:"note"`
}

type CreateProductReq struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Price       float64 `json:"price" binding:"required,gt=0"`
	Stock       int     `json:"stock" binding:"gte=0"`
}

type UpdateProductReq struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Stock       int     `json:"stock"`
}

type PatchStatusReq struct {
	Status string `json:"status" binding:"required,oneof=on_shelf off_shelf"`
}

type OrderItemReq struct {
	ProductID uuid.UUID `json:"product_id" binding:"required"`
	Quantity  int       `json:"quantity" binding:"required,gt=0"`
}

type CreateOrderReq struct {
	Items []OrderItemReq `json:"items" binding:"required,min=1"`
}

type PatchOrderStatusReq struct {
	Status string `json:"status" binding:"required,oneof=pending paid completed cancelled"`
}

// ── Trial Booking ─────────────────────────────────────────────────────────────

type TrialBookingStatus string

const (
	TrialPending         TrialBookingStatus = "pending"
	TrialApproved        TrialBookingStatus = "approved"
	TrialRejected        TrialBookingStatus = "rejected"
	TrialCancelRequested TrialBookingStatus = "cancel_requested"
	TrialCancelled       TrialBookingStatus = "cancelled"
)

type TrialBooking struct {
	ID             uuid.UUID           `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AvailabilityID uuid.UUID           `gorm:"type:uuid;not null;index" json:"availability_id"`
	Availability   CoachAvailability   `gorm:"foreignKey:AvailabilityID" json:"availability,omitempty"`
	CoachID        uuid.UUID           `gorm:"type:uuid;not null;index" json:"coach_id"`
	Coach          User                `gorm:"foreignKey:CoachID" json:"coach,omitempty"`
	GuestName      string              `gorm:"not null" json:"guest_name"`
	GuestPhone     string              `gorm:"not null" json:"guest_phone"`
	BookingStart   time.Time           `gorm:"not null" json:"booking_start"`
	BookingEnd     time.Time           `gorm:"not null" json:"booking_end"`
	Status         TrialBookingStatus  `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	PreviousStatus *TrialBookingStatus `gorm:"type:varchar(20)" json:"previous_status,omitempty"`
	CreatedAt      time.Time           `json:"created_at"`
	UpdatedAt      time.Time           `json:"updated_at"`
}

type CreateTrialBookingReq struct {
	AvailabilityID uuid.UUID `json:"availability_id" binding:"required"`
	BookingStart   time.Time `json:"booking_start" binding:"required"`
	GuestName      string    `json:"guest_name" binding:"required"`
	GuestPhone     string    `json:"guest_phone" binding:"required"`
	Password       string    `json:"password" binding:"required"`
}

// ── System Setting ────────────────────────────────────────────────────────────

type SystemSetting struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Key       string    `gorm:"uniqueIndex;not null" json:"key"`
	Value     string    `gorm:"not null;default:''" json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SetTrialPasswordReq struct {
	Password string `json:"password" binding:"required"`
}

// ── Award ─────────────────────────────────────────────────────────────────────

type Award struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Year      string    `gorm:"not null" json:"year"`
	Title     string    `gorm:"not null" json:"title"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateAwardReq struct {
	Year  string `json:"year" binding:"required"`
	Title string `json:"title" binding:"required"`
}
