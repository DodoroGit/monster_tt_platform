package service

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"time"

	"monster_tt/backend/model"
	"monster_tt/backend/repository"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func generateJWT(userID uuid.UUID, role, secret string) (string, error) {
	claims := model.JWTClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}

// ── Auth ──────────────────────────────────────────────────────────────────────

type AuthService interface {
	Register(req model.RegisterReq) (*model.User, error)
	Login(req model.LoginReq) (string, *model.User, error)
}

type authSvc struct {
	userRepo  repository.UserRepository
	jwtSecret string
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret string) AuthService {
	return &authSvc{userRepo, jwtSecret}
}

func (s *authSvc) Register(req model.RegisterReq) (*model.User, error) {
	if _, err := s.userRepo.FindByPhone(req.Phone); err == nil {
		return nil, errors.New("phone already registered")
	}
	user := &model.User{
		Name:  req.Name,
		Phone: req.Phone,
		Role:  model.RoleCustomer,
	}
	return user, s.userRepo.Create(user)
}

func (s *authSvc) Login(req model.LoginReq) (string, *model.User, error) {
	user, err := s.userRepo.FindByPhone(req.Phone)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil, errors.New("invalid credentials")
		}
		return "", nil, err
	}
	if user.Name != req.Name {
		return "", nil, errors.New("invalid credentials")
	}
	token, err := generateJWT(user.ID, string(user.Role), s.jwtSecret)
	return token, user, err
}

// ── User ──────────────────────────────────────────────────────────────────────

type UserService interface {
	List() ([]model.User, error)
	Create(req model.CreateUserReq) (*model.User, error)
	PatchRole(id uuid.UUID, role string) error
	UpdateMyProfile(id uuid.UUID, req model.UpdateMyProfileReq) (*model.User, error)
	UpdateByOwner(id uuid.UUID, req model.UpdateUserByOwnerReq) (*model.User, error)
}

type userSvc struct{ userRepo repository.UserRepository }

func NewUserService(userRepo repository.UserRepository) UserService { return &userSvc{userRepo} }

func (s *userSvc) List() ([]model.User, error) { return s.userRepo.List() }

func (s *userSvc) Create(req model.CreateUserReq) (*model.User, error) {
	if _, err := s.userRepo.FindByPhone(req.Phone); err == nil {
		return nil, errors.New("phone already registered")
	}
	user := &model.User{
		Name:  req.Name,
		Phone: req.Phone,
		Role:  model.UserRole(req.Role),
	}
	return user, s.userRepo.Create(user)
}

func (s *userSvc) PatchRole(id uuid.UUID, role string) error {
	if _, err := s.userRepo.FindByID(id); err != nil {
		return errors.New("user not found")
	}
	return s.userRepo.UpdateRole(id, model.UserRole(role))
}

func (s *userSvc) UpdateMyProfile(id uuid.UUID, req model.UpdateMyProfileReq) (*model.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}
	fields := map[string]interface{}{}
	if user.Email == "" && req.Email != "" {
		fields["email"] = req.Email
	}
	if user.LineID == "" && req.LineID != "" {
		fields["line_id"] = req.LineID
	}
	if user.Birthday == nil && req.Birthday != nil {
		fields["birthday"] = req.Birthday
	}
	if user.Gender == "" && req.Gender != "" {
		fields["gender"] = req.Gender
	}
	if len(fields) == 0 {
		return user, nil
	}
	if err := s.userRepo.UpdateProfile(id, fields); err != nil {
		return nil, err
	}
	return s.userRepo.FindByID(id)
}

func (s *userSvc) UpdateByOwner(id uuid.UUID, req model.UpdateUserByOwnerReq) (*model.User, error) {
	if _, err := s.userRepo.FindByID(id); err != nil {
		return nil, errors.New("user not found")
	}
	fields := map[string]interface{}{
		"name":     req.Name,
		"phone":    req.Phone,
		"email":    req.Email,
		"line_id":  req.LineID,
		"birthday": req.Birthday,
		"gender":   req.Gender,
	}
	if err := s.userRepo.UpdateByOwner(id, fields); err != nil {
		return nil, err
	}
	return s.userRepo.FindByID(id)
}

// ── Coach ─────────────────────────────────────────────────────────────────────

type CoachService interface {
	ListAll() ([]model.CoachProfile, error)
	GetByID(id uuid.UUID) (*model.CoachProfile, error)
	UpdateMyProfile(userID uuid.UUID, req model.UpdateProfileReq) (*model.CoachProfile, error)
	UploadAvatar(userID uuid.UUID, file multipart.File, header *multipart.FileHeader) (*model.CoachProfile, error)
	ServeAvatar(profileID uuid.UUID) (*model.CoachProfile, error)
	AddTitle(userID uuid.UUID, title string) (*model.CoachTitle, error)
	DeleteTitle(userID uuid.UUID, titleID uuid.UUID) error
	UpdateTitle(userID uuid.UUID, titleID uuid.UUID, newTitle string) error
	ReorderTitles(userID uuid.UUID, ids []uuid.UUID) error
}

type coachSvc struct{ coachRepo repository.CoachRepository }

func NewCoachService(coachRepo repository.CoachRepository) CoachService { return &coachSvc{coachRepo} }

func (s *coachSvc) ListAll() ([]model.CoachProfile, error) { return s.coachRepo.FindAll() }

func (s *coachSvc) GetByID(id uuid.UUID) (*model.CoachProfile, error) {
	p, err := s.coachRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("coach not found")
		}
		return nil, err
	}
	return p, nil
}

func (s *coachSvc) UpdateMyProfile(userID uuid.UUID, req model.UpdateProfileReq) (*model.CoachProfile, error) {
	profile, err := s.coachRepo.FindByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			profile = &model.CoachProfile{UserID: userID}
		} else {
			return nil, err
		}
	}
	profile.Bio = req.Bio
	profile.Specialty = req.Specialty
	profile.YearsExp = req.YearsExp
	if req.AvatarURL != "" {
		profile.AvatarURL = req.AvatarURL
	}
	return profile, s.coachRepo.Upsert(profile)
}

func (s *coachSvc) UploadAvatar(userID uuid.UUID, file multipart.File, header *multipart.FileHeader) (*model.CoachProfile, error) {
	profile, err := s.coachRepo.FindByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			profile = &model.CoachProfile{UserID: userID}
			if err := s.coachRepo.Upsert(profile); err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	data, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}
	ct := header.Header.Get("Content-Type")
	if ct == "" {
		ct = "image/jpeg"
	}
	profile.AvatarData = data
	profile.AvatarContentType = ct
	profile.AvatarURL = fmt.Sprintf("/api/v1/coaches/%s/avatar", profile.ID)
	return profile, s.coachRepo.Upsert(profile)
}

func (s *coachSvc) ServeAvatar(profileID uuid.UUID) (*model.CoachProfile, error) {
	return s.coachRepo.FindByID(profileID)
}

func (s *coachSvc) AddTitle(userID uuid.UUID, title string) (*model.CoachTitle, error) {
	profile, err := s.coachRepo.FindByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			profile = &model.CoachProfile{UserID: userID}
			if err := s.coachRepo.Upsert(profile); err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	t := &model.CoachTitle{ProfileID: profile.ID, Title: title}
	return t, s.coachRepo.AddTitle(t)
}

func (s *coachSvc) DeleteTitle(userID uuid.UUID, titleID uuid.UUID) error {
	profile, err := s.coachRepo.FindByUserID(userID)
	if err != nil {
		return errors.New("profile not found")
	}
	return s.coachRepo.DeleteTitle(profile.ID, titleID)
}

func (s *coachSvc) UpdateTitle(userID uuid.UUID, titleID uuid.UUID, newTitle string) error {
	if newTitle == "" {
		return errors.New("title cannot be empty")
	}
	profile, err := s.coachRepo.FindByUserID(userID)
	if err != nil {
		return errors.New("profile not found")
	}
	return s.coachRepo.UpdateTitle(profile.ID, titleID, newTitle)
}

func (s *coachSvc) ReorderTitles(userID uuid.UUID, ids []uuid.UUID) error {
	profile, err := s.coachRepo.FindByUserID(userID)
	if err != nil {
		return errors.New("profile not found")
	}
	return s.coachRepo.ReorderTitles(profile.ID, ids)
}

// ── Availability ──────────────────────────────────────────────────────────────

type AvailabilityService interface {
	Create(coachID uuid.UUID, req model.CreateAvailabilityReq) (*model.CoachAvailability, error)
	ListByCoachAndRange(coachID uuid.UUID, from, to time.Time) ([]model.CoachAvailability, error)
	ListMine(coachID uuid.UUID) ([]model.CoachAvailability, error)
	Delete(coachID uuid.UUID, availID uuid.UUID) error
	DeleteByOwner(availID uuid.UUID) error
}

type availSvc struct{ availRepo repository.AvailabilityRepository }

func NewAvailabilityService(r repository.AvailabilityRepository) AvailabilityService {
	return &availSvc{r}
}

func (s *availSvc) Create(coachID uuid.UUID, req model.CreateAvailabilityReq) (*model.CoachAvailability, error) {
	if !req.StartTime.Before(req.EndTime) {
		return nil, errors.New("start_time must be before end_time")
	}
	a := &model.CoachAvailability{
		CoachID:   coachID,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
		Status:    model.AvailabilityAvailable,
	}
	return a, s.availRepo.Create(a)
}

func (s *availSvc) ListByCoachAndRange(coachID uuid.UUID, from, to time.Time) ([]model.CoachAvailability, error) {
	return s.availRepo.FindByCoachAndRange(coachID, from, to)
}

func (s *availSvc) ListMine(coachID uuid.UUID) ([]model.CoachAvailability, error) {
	return s.availRepo.FindByCoach(coachID)
}

func (s *availSvc) Delete(coachID uuid.UUID, availID uuid.UUID) error {
	a, err := s.availRepo.FindByID(availID)
	if err != nil {
		return errors.New("availability not found")
	}
	if a.CoachID != coachID {
		return errors.New("forbidden")
	}
	if a.Status == model.AvailabilityBooked {
		return errors.New("cannot delete a booked slot")
	}
	return s.availRepo.Delete(availID)
}

func (s *availSvc) DeleteByOwner(availID uuid.UUID) error {
	return s.availRepo.Delete(availID)
}

// ── Booking ───────────────────────────────────────────────────────────────────

type BookingService interface {
	Create(customerID uuid.UUID, req model.CreateBookingReq) (*model.Booking, error)
	ListMine(userID uuid.UUID, role model.UserRole) ([]model.Booking, error)
	ListAll() ([]model.Booking, error)
	DeleteBooking(bookingID uuid.UUID) error
	RequestCancel(userID uuid.UUID, role model.UserRole, bookingID uuid.UUID) error
	ApproveCancellation(bookingID uuid.UUID) error
	RejectCancellation(bookingID uuid.UUID) error
	Approve(coachID uuid.UUID, bookingID uuid.UUID) error
	Reject(coachID uuid.UUID, bookingID uuid.UUID) error
	Reschedule(bookingID uuid.UUID, req model.RescheduleBookingReq) (*model.Booking, error)
}

type bookingSvc struct {
	bookingRepo repository.BookingRepository
	availRepo   repository.AvailabilityRepository
	trialRepo   repository.TrialBookingRepository
	db          *gorm.DB
}

func NewBookingService(bookingRepo repository.BookingRepository, availRepo repository.AvailabilityRepository, trialRepo repository.TrialBookingRepository, db *gorm.DB) BookingService {
	return &bookingSvc{bookingRepo, availRepo, trialRepo, db}
}

func (s *bookingSvc) Create(customerID uuid.UUID, req model.CreateBookingReq) (*model.Booking, error) {
	avail, err := s.availRepo.FindByID(req.AvailabilityID)
	if err != nil {
		return nil, errors.New("availability not found")
	}
	if avail.Status != model.AvailabilityAvailable {
		return nil, errors.New("this availability block has been cancelled")
	}
	// 使用傳入的結束時間，否則預設 +1 小時
	var bookingEnd time.Time
	if req.BookingEnd != nil {
		bookingEnd = *req.BookingEnd
	} else {
		bookingEnd = req.BookingStart.Add(time.Hour)
	}
	// 最少 30 分鐘
	if bookingEnd.Sub(req.BookingStart) < 30*time.Minute {
		return nil, errors.New("booking duration must be at least 30 minutes")
	}
	// 確認在教練開放的時間範圍內
	if req.BookingStart.Before(avail.StartTime) || !bookingEnd.After(avail.StartTime) || bookingEnd.After(avail.EndTime) {
		return nil, errors.New("selected time is outside the coach's available range")
	}
	// 確認無衝突（同一教練同一時間只能一筆）
	overlap, err := s.bookingRepo.OverlapExists(avail.CoachID, req.BookingStart, bookingEnd)
	if err != nil {
		return nil, err
	}
	if overlap {
		return nil, errors.New("this time slot is already booked")
	}
	// 也確認不與試教時段衝突
	trialOverlap, err := s.trialRepo.OverlapExists(avail.CoachID, req.BookingStart, bookingEnd, nil)
	if err != nil {
		return nil, err
	}
	if trialOverlap {
		return nil, errors.New("this time slot conflicts with a trial booking")
	}
	booking := &model.Booking{
		AvailabilityID: req.AvailabilityID,
		CustomerID:     customerID,
		CoachID:        avail.CoachID,
		Status:         model.BookingConfirmed,
		BookingStart:   req.BookingStart,
		BookingEnd:     bookingEnd,
		Note:           req.Note,
	}
	return booking, s.bookingRepo.Create(booking)
}

func (s *bookingSvc) ListMine(userID uuid.UUID, role model.UserRole) ([]model.Booking, error) {
	if role == model.RoleCoach {
		return s.bookingRepo.FindByCoach(userID)
	}
	return s.bookingRepo.FindByCustomer(userID)
}

func (s *bookingSvc) ListAll() ([]model.Booking, error) {
	return s.bookingRepo.FindAll()
}

func (s *bookingSvc) DeleteBooking(bookingID uuid.UUID) error {
	return s.bookingRepo.DeleteByID(bookingID)
}

func (s *bookingSvc) RequestCancel(userID uuid.UUID, role model.UserRole, bookingID uuid.UUID) error {
	b, err := s.bookingRepo.FindByID(bookingID)
	if err != nil {
		return errors.New("booking not found")
	}
	if b.CustomerID != userID && b.CoachID != userID {
		return errors.New("forbidden")
	}
	if b.Status != model.BookingPending && b.Status != model.BookingConfirmed {
		return errors.New("booking cannot be cancelled in current status")
	}
	return s.bookingRepo.SetCancelRequested(bookingID, b.Status)
}

func (s *bookingSvc) ApproveCancellation(bookingID uuid.UUID) error {
	b, err := s.bookingRepo.FindByID(bookingID)
	if err != nil {
		return errors.New("booking not found")
	}
	if b.Status != model.BookingCancelRequested {
		return errors.New("booking is not pending cancellation")
	}
	return s.bookingRepo.UpdateStatus(bookingID, model.BookingCancelled)
}

func (s *bookingSvc) RejectCancellation(bookingID uuid.UUID) error {
	b, err := s.bookingRepo.FindByID(bookingID)
	if err != nil {
		return errors.New("booking not found")
	}
	if b.Status != model.BookingCancelRequested {
		return errors.New("booking is not pending cancellation")
	}
	prev := model.BookingPending
	if b.PreviousStatus != nil {
		prev = *b.PreviousStatus
	}
	return s.bookingRepo.UpdateStatus(bookingID, prev)
}

func (s *bookingSvc) Approve(coachID uuid.UUID, bookingID uuid.UUID) error {
	b, err := s.bookingRepo.FindByID(bookingID)
	if err != nil {
		return errors.New("booking not found")
	}
	if b.CoachID != coachID {
		return errors.New("forbidden")
	}
	if b.Status != model.BookingPending {
		return errors.New("booking is not pending")
	}
	return s.bookingRepo.UpdateStatus(bookingID, model.BookingConfirmed)
}

func (s *bookingSvc) Reject(coachID uuid.UUID, bookingID uuid.UUID) error {
	b, err := s.bookingRepo.FindByID(bookingID)
	if err != nil {
		return errors.New("booking not found")
	}
	if b.CoachID != coachID {
		return errors.New("forbidden")
	}
	if b.Status != model.BookingPending {
		return errors.New("booking is not pending")
	}
	return s.db.Model(&model.Booking{}).Where("id = ?", bookingID).
		Update("status", model.BookingCancelled).Error
}

func (s *bookingSvc) Reschedule(bookingID uuid.UUID, req model.RescheduleBookingReq) (*model.Booking, error) {
	if !req.BookingEnd.After(req.BookingStart) {
		return nil, errors.New("結束時間必須晚於開始時間")
	}
	if _, err := s.bookingRepo.FindByID(bookingID); err != nil {
		return nil, errors.New("booking not found")
	}
	if err := s.bookingRepo.UpdateTimes(bookingID, req.BookingStart, req.BookingEnd); err != nil {
		return nil, err
	}
	return s.bookingRepo.FindByID(bookingID)
}

// ── Product ───────────────────────────────────────────────────────────────────

type ProductService interface {
	List(onShelfOnly bool) ([]model.Product, error)
	GetByID(id uuid.UUID) (*model.Product, error)
	Create(ownerID uuid.UUID, req model.CreateProductReq) (*model.Product, error)
	Update(id uuid.UUID, req model.UpdateProductReq) (*model.Product, error)
	Delete(id uuid.UUID) error
	PatchStatus(id uuid.UUID, status string) error
	UploadImage(productID uuid.UUID, file multipart.File, header *multipart.FileHeader) (*model.ProductImage, error)
	GetImageData(imageID uuid.UUID) (*model.ProductImage, error)
	DeleteImage(productID, imageID uuid.UUID) error
}

type productSvc struct{ productRepo repository.ProductRepository }

func NewProductService(productRepo repository.ProductRepository) ProductService {
	return &productSvc{productRepo}
}

func (s *productSvc) List(onShelfOnly bool) ([]model.Product, error) {
	return s.productRepo.FindAll(onShelfOnly)
}

func (s *productSvc) GetByID(id uuid.UUID) (*model.Product, error) {
	p, err := s.productRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("product not found")
		}
		return nil, err
	}
	return p, nil
}

func (s *productSvc) Create(ownerID uuid.UUID, req model.CreateProductReq) (*model.Product, error) {
	p := &model.Product{
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Stock:       req.Stock,
		Status:      model.ProductOffShelf,
		CreatedBy:   ownerID,
	}
	return p, s.productRepo.Create(p)
}

func (s *productSvc) Update(id uuid.UUID, req model.UpdateProductReq) (*model.Product, error) {
	p, err := s.productRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("product not found")
	}
	if req.Name != "" {
		p.Name = req.Name
	}
	if req.Description != "" {
		p.Description = req.Description
	}
	if req.Price > 0 {
		p.Price = req.Price
	}
	if req.Stock >= 0 {
		p.Stock = req.Stock
	}
	return p, s.productRepo.Update(p)
}

func (s *productSvc) Delete(id uuid.UUID) error {
	if _, err := s.productRepo.FindByID(id); err != nil {
		return errors.New("product not found")
	}
	return s.productRepo.Delete(id)
}

func (s *productSvc) PatchStatus(id uuid.UUID, status string) error {
	if _, err := s.productRepo.FindByID(id); err != nil {
		return errors.New("product not found")
	}
	return s.productRepo.UpdateStatus(id, model.ProductStatus(status))
}

func (s *productSvc) UploadImage(productID uuid.UUID, file multipart.File, header *multipart.FileHeader) (*model.ProductImage, error) {
	if _, err := s.productRepo.FindByID(productID); err != nil {
		return nil, errors.New("product not found")
	}
	data, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}
	ct := header.Header.Get("Content-Type")
	if ct == "" {
		ct = "image/jpeg"
	}
	if err := s.productRepo.DeleteImagesByProductID(productID); err != nil {
		return nil, err
	}
	imgID := uuid.New()
	imageURL := fmt.Sprintf("/api/v1/products/%s/images/%s", productID, imgID)
	img := &model.ProductImage{ID: imgID, ProductID: productID, ImageData: data, ContentType: ct, ImageURL: imageURL}
	if err := s.productRepo.AddImage(img); err != nil {
		return nil, err
	}
	return img, nil
}

func (s *productSvc) GetImageData(imageID uuid.UUID) (*model.ProductImage, error) {
	img, err := s.productRepo.FindImageByID(imageID)
	if err != nil {
		return nil, errors.New("image not found")
	}
	return img, nil
}

func (s *productSvc) DeleteImage(productID, imageID uuid.UUID) error {
	img, err := s.productRepo.FindImageByID(imageID)
	if err != nil {
		return errors.New("image not found")
	}
	if img.ProductID != productID {
		return errors.New("forbidden")
	}
	return s.productRepo.DeleteImage(imageID)
}

// ── Order ─────────────────────────────────────────────────────────────────────

type OrderService interface {
	Create(customerID uuid.UUID, req model.CreateOrderReq) (*model.Order, error)
	ListMine(customerID uuid.UUID) ([]model.Order, error)
	ListAll() ([]model.Order, error)
	PatchStatus(id uuid.UUID, status string) error
	Delete(id uuid.UUID) error
}

type orderSvc struct {
	orderRepo   repository.OrderRepository
	productRepo repository.ProductRepository
	db          *gorm.DB
}

func NewOrderService(orderRepo repository.OrderRepository, productRepo repository.ProductRepository, db *gorm.DB) OrderService {
	return &orderSvc{orderRepo, productRepo, db}
}

func (s *orderSvc) Create(customerID uuid.UUID, req model.CreateOrderReq) (*model.Order, error) {
	var order *model.Order
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var total float64
		var items []model.OrderItem
		for _, item := range req.Items {
			p, err := s.productRepo.FindByID(item.ProductID)
			if err != nil {
				return errors.New("product not found: " + item.ProductID.String())
			}
			if p.Status != model.ProductOnShelf {
				return errors.New("product not on shelf: " + p.Name)
			}
			if p.Stock < item.Quantity {
				return errors.New("insufficient stock: " + p.Name)
			}
			items = append(items, model.OrderItem{
				ProductID: p.ID,
				Quantity:  item.Quantity,
				UnitPrice: p.Price,
			})
			total += p.Price * float64(item.Quantity)
			if err := tx.Model(&model.Product{}).Where("id = ?", p.ID).
				Update("stock", gorm.Expr("stock - ?", item.Quantity)).Error; err != nil {
				return err
			}
		}
		order = &model.Order{
			CustomerID:  customerID,
			TotalAmount: total,
			Status:      model.OrderPending,
			Items:       items,
		}
		return tx.Create(order).Error
	})
	return order, err
}

func (s *orderSvc) ListMine(customerID uuid.UUID) ([]model.Order, error) {
	return s.orderRepo.FindByCustomer(customerID)
}

func (s *orderSvc) ListAll() ([]model.Order, error) { return s.orderRepo.FindAll() }

func (s *orderSvc) Delete(id uuid.UUID) error {
	return s.orderRepo.DeleteByID(id)
}

func (s *orderSvc) PatchStatus(id uuid.UUID, status string) error {
	if _, err := s.orderRepo.FindByID(id); err != nil {
		return errors.New("order not found")
	}
	return s.orderRepo.UpdateStatus(id, model.OrderStatus(status))
}

// ── TrialBooking ──────────────────────────────────────────────────────────────

type TrialBookingService interface {
	Create(req model.CreateTrialBookingReq) (*model.TrialBooking, error)
	ListAll() ([]model.TrialBooking, error)
	ListByCoach(coachID uuid.UUID) ([]model.TrialBooking, error)
	Approve(id uuid.UUID) error
	Reject(id uuid.UUID) error
	Delete(id uuid.UUID) error
	RequestCancel(coachID uuid.UUID, id uuid.UUID) error
	ApproveCancellation(id uuid.UUID) error
	RejectCancellation(id uuid.UUID) error
}

type trialBookingSvc struct {
	trialRepo   repository.TrialBookingRepository
	availRepo   repository.AvailabilityRepository
	settingRepo repository.SystemSettingRepository
}

func NewTrialBookingService(
	trialRepo repository.TrialBookingRepository,
	availRepo repository.AvailabilityRepository,
	settingRepo repository.SystemSettingRepository,
) TrialBookingService {
	return &trialBookingSvc{trialRepo, availRepo, settingRepo}
}

func (s *trialBookingSvc) Create(req model.CreateTrialBookingReq) (*model.TrialBooking, error) {
	pwd, err := s.settingRepo.Get("trial_password")
	if err != nil || pwd == "" {
		return nil, errors.New("試教功能尚未開放，請聯繫店長")
	}
	if req.Password != pwd {
		return nil, errors.New("試教密碼錯誤")
	}
	avail, err := s.availRepo.FindByID(req.AvailabilityID)
	if err != nil {
		return nil, errors.New("availability not found")
	}
	if avail.Status != model.AvailabilityAvailable {
		return nil, errors.New("此時段已被預約")
	}
	bookingEnd := req.BookingStart.Add(30 * time.Minute)
	if req.BookingStart.Before(avail.StartTime) || bookingEnd.After(avail.EndTime) {
		return nil, errors.New("選擇的時間超出教練開放範圍")
	}
	overlap, err := s.trialRepo.OverlapExists(avail.CoachID, req.BookingStart, bookingEnd, nil)
	if err != nil {
		return nil, err
	}
	if overlap {
		return nil, errors.New("此時段已有試教申請")
	}
	tb := &model.TrialBooking{
		AvailabilityID: req.AvailabilityID,
		CoachID:        avail.CoachID,
		GuestName:      req.GuestName,
		GuestPhone:     req.GuestPhone,
		BookingStart:   req.BookingStart,
		BookingEnd:     bookingEnd,
		Status:         model.TrialPending,
	}
	return tb, s.trialRepo.Create(tb)
}

func (s *trialBookingSvc) ListAll() ([]model.TrialBooking, error) { return s.trialRepo.FindAll() }

func (s *trialBookingSvc) ListByCoach(coachID uuid.UUID) ([]model.TrialBooking, error) {
	return s.trialRepo.FindByCoach(coachID)
}

func (s *trialBookingSvc) Approve(id uuid.UUID) error {
	if _, err := s.trialRepo.FindByID(id); err != nil {
		return errors.New("not found")
	}
	return s.trialRepo.UpdateStatus(id, model.TrialApproved)
}

func (s *trialBookingSvc) Reject(id uuid.UUID) error {
	if _, err := s.trialRepo.FindByID(id); err != nil {
		return errors.New("not found")
	}
	return s.trialRepo.UpdateStatus(id, model.TrialRejected)
}

func (s *trialBookingSvc) Delete(id uuid.UUID) error {
	return s.trialRepo.DeleteByID(id)
}

func (s *trialBookingSvc) RequestCancel(coachID uuid.UUID, id uuid.UUID) error {
	tb, err := s.trialRepo.FindByID(id)
	if err != nil {
		return errors.New("trial booking not found")
	}
	if tb.CoachID != coachID {
		return errors.New("forbidden")
	}
	if tb.Status != model.TrialPending && tb.Status != model.TrialApproved {
		return errors.New("trial booking cannot be cancelled in current status")
	}
	return s.trialRepo.SetCancelRequested(id, tb.Status)
}

func (s *trialBookingSvc) ApproveCancellation(id uuid.UUID) error {
	tb, err := s.trialRepo.FindByID(id)
	if err != nil {
		return errors.New("trial booking not found")
	}
	if tb.Status != model.TrialCancelRequested {
		return errors.New("trial booking is not pending cancellation")
	}
	return s.trialRepo.UpdateStatus(id, model.TrialCancelled)
}

func (s *trialBookingSvc) RejectCancellation(id uuid.UUID) error {
	tb, err := s.trialRepo.FindByID(id)
	if err != nil {
		return errors.New("trial booking not found")
	}
	if tb.Status != model.TrialCancelRequested {
		return errors.New("trial booking is not pending cancellation")
	}
	prev := model.TrialApproved
	if tb.PreviousStatus != nil {
		prev = *tb.PreviousStatus
	}
	return s.trialRepo.UpdateStatus(id, prev)
}

// ── SystemSetting ─────────────────────────────────────────────────────────────

type SystemSettingService interface {
	GetTrialPassword() (string, error)
	SetTrialPassword(password string) error
}

type systemSettingSvc struct{ repo repository.SystemSettingRepository }

func NewSystemSettingService(repo repository.SystemSettingRepository) SystemSettingService {
	return &systemSettingSvc{repo}
}

func (s *systemSettingSvc) GetTrialPassword() (string, error) {
	pwd, err := s.repo.Get("trial_password")
	if err != nil {
		return "", nil
	}
	return pwd, nil
}

func (s *systemSettingSvc) SetTrialPassword(password string) error {
	return s.repo.Set("trial_password", password)
}

// ── Award ─────────────────────────────────────────────────────────────────────

type AwardService interface {
	List() ([]model.Award, error)
	Create(req model.CreateAwardReq) (*model.Award, error)
	Delete(id uuid.UUID) error
}

type awardSvc struct{ repo repository.AwardRepository }

func NewAwardService(repo repository.AwardRepository) AwardService { return &awardSvc{repo} }

func (s *awardSvc) List() ([]model.Award, error) { return s.repo.List() }

func (s *awardSvc) Create(req model.CreateAwardReq) (*model.Award, error) {
	a := &model.Award{Year: req.Year, Title: req.Title}
	return a, s.repo.Create(a)
}

func (s *awardSvc) Delete(id uuid.UUID) error { return s.repo.Delete(id) }
