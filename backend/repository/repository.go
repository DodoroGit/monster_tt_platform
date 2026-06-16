package repository

import (
	"fmt"
	"time"

	"monster_tt/backend/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ── User ──────────────────────────────────────────────────────────────────────

type UserRepository interface {
	Create(user *model.User) error
	FindByID(id uuid.UUID) (*model.User, error)
	FindByPhone(phone string) (*model.User, error)
	List() ([]model.User, error)
	UpdateRole(id uuid.UUID, role model.UserRole) error
}

type userRepo struct{ db *gorm.DB }

func NewUserRepo(db *gorm.DB) UserRepository { return &userRepo{db} }

func (r *userRepo) Create(u *model.User) error { return r.db.Create(u).Error }

func (r *userRepo) FindByID(id uuid.UUID) (*model.User, error) {
	var u model.User
	if err := r.db.First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) FindByPhone(phone string) (*model.User, error) {
	var u model.User
	if err := r.db.First(&u, "phone = ?", phone).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) List() ([]model.User, error) {
	var users []model.User
	return users, r.db.Find(&users).Error
}

func (r *userRepo) UpdateRole(id uuid.UUID, role model.UserRole) error {
	return r.db.Model(&model.User{}).Where("id = ?", id).Update("role", role).Error
}

// ── Coach ─────────────────────────────────────────────────────────────────────

type CoachRepository interface {
	FindAll() ([]model.CoachProfile, error)
	FindByID(id uuid.UUID) (*model.CoachProfile, error)
	FindByUserID(userID uuid.UUID) (*model.CoachProfile, error)
	Upsert(profile *model.CoachProfile) error
	AddTitle(title *model.CoachTitle) error
	DeleteTitle(profileID uuid.UUID, titleID uuid.UUID) error
	UpdateTitle(profileID uuid.UUID, titleID uuid.UUID, newTitle string) error
	ReorderTitles(profileID uuid.UUID, ids []uuid.UUID) error
}

type coachRepo struct{ db *gorm.DB }

func NewCoachRepo(db *gorm.DB) CoachRepository { return &coachRepo{db} }

func (r *coachRepo) FindAll() ([]model.CoachProfile, error) {
	var profiles []model.CoachProfile
	return profiles, r.db.Preload("User").Preload("Titles", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order ASC, created_at ASC")
	}).Find(&profiles).Error
}

func (r *coachRepo) FindByID(id uuid.UUID) (*model.CoachProfile, error) {
	var p model.CoachProfile
	if err := r.db.Preload("User").Preload("Titles", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order ASC, created_at ASC")
	}).First(&p, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *coachRepo) FindByUserID(userID uuid.UUID) (*model.CoachProfile, error) {
	var p model.CoachProfile
	if err := r.db.Preload("User").Preload("Titles", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order ASC, created_at ASC")
	}).First(&p, "user_id = ?", userID).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *coachRepo) Upsert(profile *model.CoachProfile) error {
	return r.db.Save(profile).Error
}

func (r *coachRepo) AddTitle(title *model.CoachTitle) error {
	return r.db.Create(title).Error
}

func (r *coachRepo) DeleteTitle(profileID uuid.UUID, titleID uuid.UUID) error {
	return r.db.Where("id = ? AND profile_id = ?", titleID, profileID).Delete(&model.CoachTitle{}).Error
}

func (r *coachRepo) UpdateTitle(profileID uuid.UUID, titleID uuid.UUID, newTitle string) error {
	return r.db.Model(&model.CoachTitle{}).
		Where("id = ? AND profile_id = ?", titleID, profileID).
		Update("title", newTitle).Error
}

func (r *coachRepo) ReorderTitles(profileID uuid.UUID, ids []uuid.UUID) error {
	for i, id := range ids {
		if err := r.db.Model(&model.CoachTitle{}).
			Where("id = ? AND profile_id = ?", id, profileID).
			Update("sort_order", i).Error; err != nil {
			return err
		}
	}
	return nil
}

// ── Availability ──────────────────────────────────────────────────────────────

type AvailabilityRepository interface {
	Create(a *model.CoachAvailability) error
	FindByCoachAndRange(coachID uuid.UUID, from, to time.Time) ([]model.CoachAvailability, error)
	FindByCoach(coachID uuid.UUID) ([]model.CoachAvailability, error)
	FindByID(id uuid.UUID) (*model.CoachAvailability, error)
	UpdateStatus(id uuid.UUID, status model.AvailabilityStatus) error
	Delete(id uuid.UUID) error
}

type availRepo struct{ db *gorm.DB }

func NewAvailabilityRepo(db *gorm.DB) AvailabilityRepository { return &availRepo{db} }

func (r *availRepo) Create(a *model.CoachAvailability) error { return r.db.Create(a).Error }

func (r *availRepo) FindByCoachAndRange(coachID uuid.UUID, from, to time.Time) ([]model.CoachAvailability, error) {
	var list []model.CoachAvailability
	q := r.db.Where("coach_availabilities.coach_id = ? AND coach_availabilities.status = 'available'", coachID)
	if !from.IsZero() {
		q = q.Where("start_time >= ?", from)
	}
	if !to.IsZero() {
		q = q.Where("end_time <= ?", to)
	}
	err := q.Order("start_time").
		Preload("Bookings", "status NOT IN ('cancelled')").
		Preload("TrialBookings", "status != 'rejected'").
		Find(&list).Error
	return list, err
}

func (r *availRepo) FindByCoach(coachID uuid.UUID) ([]model.CoachAvailability, error) {
	var list []model.CoachAvailability
	return list, r.db.Where("coach_id = ?", coachID).Order("start_time desc").Find(&list).Error
}

func (r *availRepo) FindByID(id uuid.UUID) (*model.CoachAvailability, error) {
	var a model.CoachAvailability
	if err := r.db.First(&a, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *availRepo) UpdateStatus(id uuid.UUID, status model.AvailabilityStatus) error {
	return r.db.Model(&model.CoachAvailability{}).Where("id = ?", id).Update("status", status).Error
}

func (r *availRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.CoachAvailability{}, "id = ?", id).Error
}

// ── Booking ───────────────────────────────────────────────────────────────────

type BookingRepository interface {
	Create(b *model.Booking) error
	FindByCustomer(customerID uuid.UUID) ([]model.Booking, error)
	FindByCoach(coachID uuid.UUID) ([]model.Booking, error)
	FindByID(id uuid.UUID) (*model.Booking, error)
	UpdateStatus(id uuid.UUID, status model.BookingStatus) error
	FindAll() ([]model.Booking, error)
	DeleteByID(id uuid.UUID) error
	OverlapExists(coachID uuid.UUID, start, end time.Time) (bool, error)
	SetCancelRequested(id uuid.UUID, prev model.BookingStatus) error
}

type bookingRepo struct{ db *gorm.DB }

func NewBookingRepo(db *gorm.DB) BookingRepository { return &bookingRepo{db} }

func (r *bookingRepo) Create(b *model.Booking) error { return r.db.Create(b).Error }

func (r *bookingRepo) FindByCustomer(customerID uuid.UUID) ([]model.Booking, error) {
	var list []model.Booking
	return list, r.db.Preload("Availability").Preload("Coach").
		Where("customer_id = ?", customerID).Order("created_at desc").Find(&list).Error
}

func (r *bookingRepo) FindByCoach(coachID uuid.UUID) ([]model.Booking, error) {
	var list []model.Booking
	return list, r.db.Preload("Availability").Preload("Customer").
		Where("coach_id = ?", coachID).Order("created_at desc").Find(&list).Error
}

func (r *bookingRepo) FindAll() ([]model.Booking, error) {
	var list []model.Booking
	return list, r.db.Preload("Availability").Preload("Customer").Preload("Coach").
		Order("created_at desc").Find(&list).Error
}

func (r *bookingRepo) DeleteByID(id uuid.UUID) error {
	return r.db.Delete(&model.Booking{}, "id = ?", id).Error
}

func (r *bookingRepo) OverlapExists(coachID uuid.UUID, start, end time.Time) (bool, error) {
	var count int64
	err := r.db.Model(&model.Booking{}).
		Where("coach_id = ? AND status IN ('pending','confirmed','cancel_requested') AND booking_start < ? AND booking_end > ?",
			coachID, end, start).
		Count(&count).Error
	return count > 0, err
}

func (r *bookingRepo) SetCancelRequested(id uuid.UUID, prev model.BookingStatus) error {
	return r.db.Model(&model.Booking{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":          model.BookingCancelRequested,
			"previous_status": prev,
		}).Error
}

func (r *bookingRepo) FindByID(id uuid.UUID) (*model.Booking, error) {
	var b model.Booking
	if err := r.db.First(&b, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *bookingRepo) UpdateStatus(id uuid.UUID, status model.BookingStatus) error {
	return r.db.Model(&model.Booking{}).Where("id = ?", id).Update("status", status).Error
}

// ── Product ───────────────────────────────────────────────────────────────────

type ProductRepository interface {
	Create(p *model.Product) error
	FindAll(onShelfOnly bool) ([]model.Product, error)
	FindByID(id uuid.UUID) (*model.Product, error)
	Update(p *model.Product) error
	Delete(id uuid.UUID) error
	UpdateStatus(id uuid.UUID, status model.ProductStatus) error
	AddImage(img *model.ProductImage) error
	DeleteImage(id uuid.UUID) error
	DeleteImagesByProductID(productID uuid.UUID) error
	FindImageByID(id uuid.UUID) (*model.ProductImage, error)
}

type productRepo struct{ db *gorm.DB }

func NewProductRepo(db *gorm.DB) ProductRepository { return &productRepo{db} }

func (r *productRepo) Create(p *model.Product) error { return r.db.Create(p).Error }

func (r *productRepo) FindAll(onShelfOnly bool) ([]model.Product, error) {
	var list []model.Product
	q := r.db.Preload("Images", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, product_id, content_type, sort_order, created_at").Order("sort_order")
	})
	if onShelfOnly {
		q = q.Where("status = 'on_shelf'")
	}
	if err := q.Order("created_at desc").Find(&list).Error; err != nil {
		return nil, err
	}
	populateImageURLs(list)
	return list, nil
}

func (r *productRepo) FindByID(id uuid.UUID) (*model.Product, error) {
	var p model.Product
	if err := r.db.Preload("Images", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, product_id, content_type, sort_order, created_at").Order("sort_order")
	}).First(&p, "id = ?", id).Error; err != nil {
		return nil, err
	}
	populateImageURLs([]model.Product{p})
	for i := range p.Images {
		p.Images[i].ImageURL = fmt.Sprintf("/api/v1/products/%s/images/%s", p.ID, p.Images[i].ID)
	}
	return &p, nil
}

func (r *productRepo) Update(p *model.Product) error {
	return r.db.Model(p).Updates(map[string]interface{}{
		"name": p.Name, "description": p.Description, "price": p.Price, "stock": p.Stock,
	}).Error
}

func (r *productRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Product{}, "id = ?", id).Error
}

func (r *productRepo) UpdateStatus(id uuid.UUID, status model.ProductStatus) error {
	return r.db.Model(&model.Product{}).Where("id = ?", id).Update("status", status).Error
}

func (r *productRepo) AddImage(img *model.ProductImage) error { return r.db.Create(img).Error }

func (r *productRepo) DeleteImage(id uuid.UUID) error {
	return r.db.Delete(&model.ProductImage{}, "id = ?", id).Error
}

func (r *productRepo) DeleteImagesByProductID(productID uuid.UUID) error {
	return r.db.Delete(&model.ProductImage{}, "product_id = ?", productID).Error
}

func (r *productRepo) FindImageByID(id uuid.UUID) (*model.ProductImage, error) {
	var img model.ProductImage
	if err := r.db.First(&img, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &img, nil
}

func populateImageURLs(products []model.Product) {
	for i := range products {
		for j := range products[i].Images {
			products[i].Images[j].ImageURL = fmt.Sprintf("/api/v1/products/%s/images/%s",
				products[i].ID, products[i].Images[j].ID)
		}
	}
}

// ── Order ─────────────────────────────────────────────────────────────────────

type OrderRepository interface {
	Create(o *model.Order) error
	FindByCustomer(customerID uuid.UUID) ([]model.Order, error)
	FindAll() ([]model.Order, error)
	FindByID(id uuid.UUID) (*model.Order, error)
	UpdateStatus(id uuid.UUID, status model.OrderStatus) error
	DeleteByID(id uuid.UUID) error
}

type orderRepo struct{ db *gorm.DB }

func NewOrderRepo(db *gorm.DB) OrderRepository { return &orderRepo{db} }

func (r *orderRepo) Create(o *model.Order) error { return r.db.Create(o).Error }

func (r *orderRepo) FindByCustomer(customerID uuid.UUID) ([]model.Order, error) {
	var list []model.Order
	return list, r.db.Preload("Items.Product").
		Where("customer_id = ?", customerID).Order("created_at desc").Find(&list).Error
}

func (r *orderRepo) FindAll() ([]model.Order, error) {
	var list []model.Order
	return list, r.db.Preload("Items.Product").Preload("Customer").
		Order("created_at desc").Find(&list).Error
}

func (r *orderRepo) FindByID(id uuid.UUID) (*model.Order, error) {
	var o model.Order
	if err := r.db.Preload("Items.Product").First(&o, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *orderRepo) UpdateStatus(id uuid.UUID, status model.OrderStatus) error {
	return r.db.Model(&model.Order{}).Where("id = ?", id).Update("status", status).Error
}

func (r *orderRepo) DeleteByID(id uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("order_id = ?", id).Delete(&model.OrderItem{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.Order{}, "id = ?", id).Error
	})
}

// ── TrialBooking ──────────────────────────────────────────────────────────────

type TrialBookingRepository interface {
	Create(tb *model.TrialBooking) error
	FindAll() ([]model.TrialBooking, error)
	FindByCoach(coachID uuid.UUID) ([]model.TrialBooking, error)
	FindByID(id uuid.UUID) (*model.TrialBooking, error)
	UpdateStatus(id uuid.UUID, status model.TrialBookingStatus) error
	SetCancelRequested(id uuid.UUID, prev model.TrialBookingStatus) error
	OverlapExists(coachID uuid.UUID, start, end time.Time, excludeID *uuid.UUID) (bool, error)
	GuestAlreadyApplied(guestName, guestPhone string) (bool, error)
	DeleteByID(id uuid.UUID) error
}

type trialBookingRepo struct{ db *gorm.DB }

func NewTrialBookingRepo(db *gorm.DB) TrialBookingRepository { return &trialBookingRepo{db} }

func (r *trialBookingRepo) Create(tb *model.TrialBooking) error { return r.db.Create(tb).Error }

func (r *trialBookingRepo) FindAll() ([]model.TrialBooking, error) {
	var list []model.TrialBooking
	return list, r.db.Preload("Availability").Preload("Coach").
		Order("created_at desc").Find(&list).Error
}

func (r *trialBookingRepo) FindByCoach(coachID uuid.UUID) ([]model.TrialBooking, error) {
	var list []model.TrialBooking
	return list, r.db.Preload("Availability").Preload("Coach").
		Where("coach_id = ?", coachID).Order("created_at desc").Find(&list).Error
}

func (r *trialBookingRepo) FindByID(id uuid.UUID) (*model.TrialBooking, error) {
	var tb model.TrialBooking
	if err := r.db.Preload("Availability").Preload("Coach").First(&tb, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &tb, nil
}

func (r *trialBookingRepo) UpdateStatus(id uuid.UUID, status model.TrialBookingStatus) error {
	return r.db.Model(&model.TrialBooking{}).Where("id = ?", id).Update("status", status).Error
}

func (r *trialBookingRepo) SetCancelRequested(id uuid.UUID, prev model.TrialBookingStatus) error {
	return r.db.Model(&model.TrialBooking{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":          model.TrialCancelRequested,
			"previous_status": prev,
		}).Error
}

func (r *trialBookingRepo) OverlapExists(coachID uuid.UUID, start, end time.Time, excludeID *uuid.UUID) (bool, error) {
	q := r.db.Model(&model.TrialBooking{}).
		Where("coach_id = ? AND status != 'rejected' AND booking_start < ? AND booking_end > ?", coachID, end, start)
	if excludeID != nil {
		q = q.Where("id != ?", *excludeID)
	}
	var count int64
	return count > 0, q.Count(&count).Error
}

func (r *trialBookingRepo) GuestAlreadyApplied(guestName, guestPhone string) (bool, error) {
	var count int64
	err := r.db.Model(&model.TrialBooking{}).
		Where("guest_name = ? AND guest_phone = ? AND status != 'rejected'", guestName, guestPhone).
		Count(&count).Error
	return count > 0, err
}

func (r *trialBookingRepo) DeleteByID(id uuid.UUID) error {
	return r.db.Delete(&model.TrialBooking{}, "id = ?", id).Error
}

// ── SystemSetting ─────────────────────────────────────────────────────────────

type SystemSettingRepository interface {
	Get(key string) (string, error)
	Set(key, value string) error
}

type systemSettingRepo struct{ db *gorm.DB }

func NewSystemSettingRepo(db *gorm.DB) SystemSettingRepository { return &systemSettingRepo{db} }

func (r *systemSettingRepo) Get(key string) (string, error) {
	var s model.SystemSetting
	if err := r.db.First(&s, "key = ?", key).Error; err != nil {
		return "", err
	}
	return s.Value, nil
}

func (r *systemSettingRepo) Set(key, value string) error {
	return r.db.Exec(
		`INSERT INTO system_settings (id, key, value, updated_at)
		 VALUES (gen_random_uuid(), ?, ?, NOW())
		 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
		key, value,
	).Error
}

// ── Award ─────────────────────────────────────────────────────────────────────

type AwardRepository interface {
	List() ([]model.Award, error)
	Create(a *model.Award) error
	Delete(id uuid.UUID) error
}

type awardRepo struct{ db *gorm.DB }

func NewAwardRepo(db *gorm.DB) AwardRepository { return &awardRepo{db} }

func (r *awardRepo) List() ([]model.Award, error) {
	var list []model.Award
	return list, r.db.Order("sort_order asc, created_at desc").Find(&list).Error
}

func (r *awardRepo) Create(a *model.Award) error { return r.db.Create(a).Error }

func (r *awardRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Award{}, "id = ?", id).Error
}
