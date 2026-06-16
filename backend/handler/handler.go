package handler

import (
	"time"

	"monster_tt/backend/middleware"
	"monster_tt/backend/model"
	"monster_tt/backend/repository"
	"monster_tt/backend/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ── Response helpers ──────────────────────────────────────────────────────────

type apiResp struct {
	Data  interface{} `json:"data"`
	Error *apiErr     `json:"error"`
}

type apiErr struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func ok(c *gin.Context, data interface{})      { c.JSON(200, apiResp{Data: data}) }
func created(c *gin.Context, data interface{}) { c.JSON(201, apiResp{Data: data}) }
func fail(c *gin.Context, status int, code, msg string) {
	c.AbortWithStatusJSON(status, apiResp{Error: &apiErr{code, msg}})
}
func badRequest(c *gin.Context, msg string)   { fail(c, 400, "BAD_REQUEST", msg) }
func unauthorized(c *gin.Context, msg string) { fail(c, 401, "UNAUTHORIZED", msg) }
func forbidden(c *gin.Context, msg string)    { fail(c, 403, "FORBIDDEN", msg) }
func notFound(c *gin.Context, msg string)     { fail(c, 404, "NOT_FOUND", msg) }
func internal(c *gin.Context, msg string)     { fail(c, 500, "INTERNAL_ERROR", msg) }
func conflict(c *gin.Context, msg string)     { fail(c, 409, "CONFLICT", msg) }

// ── Auth ──────────────────────────────────────────────────────────────────────

type AuthHandler struct {
	svc      service.AuthService
	userRepo repository.UserRepository
}

func NewAuthHandler(svc service.AuthService, userRepo repository.UserRepository) *AuthHandler {
	return &AuthHandler{svc, userRepo}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	user, err := h.svc.Register(req)
	if err != nil {
		conflict(c, err.Error())
		return
	}
	created(c, user)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	token, user, err := h.svc.Login(req)
	if err != nil {
		unauthorized(c, err.Error())
		return
	}
	ok(c, model.LoginResp{Token: token, User: user})
}

func (h *AuthHandler) Me(c *gin.Context) {
	user, err := h.userRepo.FindByID(middleware.GetUserID(c))
	if err != nil {
		notFound(c, "user not found")
		return
	}
	ok(c, user)
}

// ── User ──────────────────────────────────────────────────────────────────────

type UserHandler struct{ svc service.UserService }

func NewUserHandler(svc service.UserService) *UserHandler { return &UserHandler{svc} }

func (h *UserHandler) List(c *gin.Context) {
	users, err := h.svc.List()
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, users)
}

func (h *UserHandler) Create(c *gin.Context) {
	var req model.CreateUserReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	user, err := h.svc.Create(req)
	if err != nil {
		conflict(c, err.Error())
		return
	}
	created(c, user)
}

func (h *UserHandler) UpdateMyProfile(c *gin.Context) {
	var req model.UpdateMyProfileReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	user, err := h.svc.UpdateMyProfile(middleware.GetUserID(c), req)
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, user)
}

func (h *UserHandler) UpdateByOwner(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	var req model.UpdateUserByOwnerReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	user, err := h.svc.UpdateByOwner(id, req)
	if err != nil {
		notFound(c, err.Error())
		return
	}
	ok(c, user)
}

func (h *UserHandler) PatchRole(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	var req model.PatchRoleReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	if err := h.svc.PatchRole(id, req.Role); err != nil {
		notFound(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "role updated"})
}

// ── Coach ─────────────────────────────────────────────────────────────────────

type CoachHandler struct{ svc service.CoachService }

func NewCoachHandler(svc service.CoachService) *CoachHandler { return &CoachHandler{svc} }

func (h *CoachHandler) List(c *gin.Context) {
	profiles, err := h.svc.ListAll()
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, profiles)
}

func (h *CoachHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	p, err := h.svc.GetByID(id)
	if err != nil {
		notFound(c, err.Error())
		return
	}
	ok(c, p)
}

func (h *CoachHandler) UpdateMyProfile(c *gin.Context) {
	var req model.UpdateProfileReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	p, err := h.svc.UpdateMyProfile(middleware.GetUserID(c), req)
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, p)
}

func (h *CoachHandler) UploadAvatar(c *gin.Context) {
	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		badRequest(c, "missing avatar file")
		return
	}
	defer file.Close()
	profile, err := h.svc.UploadAvatar(middleware.GetUserID(c), file, header)
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, gin.H{"avatar_url": profile.AvatarURL})
}

func (h *CoachHandler) AddTitle(c *gin.Context) {
	var req struct {
		Title string `json:"title" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	t, err := h.svc.AddTitle(middleware.GetUserID(c), req.Title)
	if err != nil {
		internal(c, err.Error())
		return
	}
	created(c, t)
}

func (h *CoachHandler) UpdateTitle(c *gin.Context) {
	titleID, err := uuid.Parse(c.Param("titleId"))
	if err != nil {
		badRequest(c, "invalid title id")
		return
	}
	var req struct {
		Title string `json:"title" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	if err := h.svc.UpdateTitle(middleware.GetUserID(c), titleID, req.Title); err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "updated"})
}

func (h *CoachHandler) ReorderTitles(c *gin.Context) {
	var req struct {
		IDs []uuid.UUID `json:"ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	if err := h.svc.ReorderTitles(middleware.GetUserID(c), req.IDs); err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "reordered"})
}

func (h *CoachHandler) DeleteTitle(c *gin.Context) {
	titleID, err := uuid.Parse(c.Param("titleId"))
	if err != nil {
		badRequest(c, "invalid title id")
		return
	}
	if err := h.svc.DeleteTitle(middleware.GetUserID(c), titleID); err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "deleted"})
}

func (h *CoachHandler) ServeAvatar(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	profile, err := h.svc.ServeAvatar(id)
	if err != nil {
		notFound(c, "avatar not found")
		return
	}
	if len(profile.AvatarData) == 0 {
		notFound(c, "no avatar uploaded")
		return
	}
	c.Data(200, profile.AvatarContentType, profile.AvatarData)
}

// ── Availability ──────────────────────────────────────────────────────────────

type AvailabilityHandler struct {
	svc       service.AvailabilityService
	coachRepo repository.CoachRepository
}

func NewAvailabilityHandler(svc service.AvailabilityService, coachRepo repository.CoachRepository) *AvailabilityHandler {
	return &AvailabilityHandler{svc, coachRepo}
}

func (h *AvailabilityHandler) ListByCoach(c *gin.Context) {
	profileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid coach id")
		return
	}
	// :id is the coach_profile.id — resolve to the actual user_id
	profile, err := h.coachRepo.FindByID(profileID)
	if err != nil {
		notFound(c, "coach not found")
		return
	}
	var from, to time.Time
	if v := c.Query("from"); v != "" {
		from, _ = time.Parse(time.RFC3339, v)
	}
	if v := c.Query("to"); v != "" {
		to, _ = time.Parse(time.RFC3339, v)
	}
	list, err := h.svc.ListByCoachAndRange(profile.UserID, from, to)
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, list)
}

func (h *AvailabilityHandler) ListMine(c *gin.Context) {
	list, err := h.svc.ListMine(middleware.GetUserID(c))
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, list)
}

func (h *AvailabilityHandler) Create(c *gin.Context) {
	var req model.CreateAvailabilityReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	// 店長可透過 coach_id 指定教練建立時段
	coachID := middleware.GetUserID(c)
	if middleware.GetRole(c) == "owner" && req.CoachID != nil {
		coachID = *req.CoachID
	}
	a, err := h.svc.Create(coachID, req)
	if err != nil {
		badRequest(c, err.Error())
		return
	}
	created(c, a)
}

func (h *AvailabilityHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	// 店長可刪除任何教練的時段（傳 uuid.Nil 讓 service 跳過 owner check）
	userID := middleware.GetUserID(c)
	role := middleware.GetRole(c)
	if role == "owner" {
		if err := h.svc.DeleteByOwner(id); err != nil {
			badRequest(c, err.Error())
			return
		}
		ok(c, gin.H{"message": "deleted"})
		return
	}
	if err := h.svc.Delete(userID, id); err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "deleted"})
}

func (h *AvailabilityHandler) ListAll(c *gin.Context) {
	coachIDStr := c.Query("coach_id")
	if coachIDStr == "" {
		badRequest(c, "coach_id required")
		return
	}
	coachID, err := uuid.Parse(coachIDStr)
	if err != nil {
		badRequest(c, "invalid coach_id")
		return
	}
	list, err := h.svc.ListMine(coachID)
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, list)
}

// ── Booking ───────────────────────────────────────────────────────────────────

type BookingHandler struct{ svc service.BookingService }

func NewBookingHandler(svc service.BookingService) *BookingHandler { return &BookingHandler{svc} }

func (h *BookingHandler) Create(c *gin.Context) {
	var req model.CreateBookingReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	b, err := h.svc.Create(middleware.GetUserID(c), req)
	if err != nil {
		conflict(c, err.Error())
		return
	}
	created(c, b)
}

func (h *BookingHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.DeleteBooking(id); err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "deleted"})
}

func (h *BookingHandler) ListAll(c *gin.Context) {
	list, err := h.svc.ListAll()
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, list)
}

func (h *BookingHandler) ListMine(c *gin.Context) {
	list, err := h.svc.ListMine(middleware.GetUserID(c), model.UserRole(middleware.GetRole(c)))
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, list)
}

func (h *BookingHandler) Cancel(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.RequestCancel(middleware.GetUserID(c), model.UserRole(middleware.GetRole(c)), id); err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "cancel requested"})
}

func (h *BookingHandler) ApproveCancellation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.ApproveCancellation(id); err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "cancellation approved"})
}

func (h *BookingHandler) RejectCancellation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.RejectCancellation(id); err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "cancellation rejected"})
}

func (h *BookingHandler) Approve(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.Approve(middleware.GetUserID(c), id); err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "approved"})
}

func (h *BookingHandler) Reject(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.Reject(middleware.GetUserID(c), id); err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "rejected"})
}

func (h *BookingHandler) Reschedule(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	var req model.RescheduleBookingReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	b, err := h.svc.Reschedule(id, req)
	if err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, b)
}

// ── Product ───────────────────────────────────────────────────────────────────

type ProductHandler struct{ svc service.ProductService }

func NewProductHandler(svc service.ProductService) *ProductHandler { return &ProductHandler{svc} }

func (h *ProductHandler) List(c *gin.Context) {
	list, err := h.svc.List(c.Query("all") != "true")
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, list)
}

func (h *ProductHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	p, err := h.svc.GetByID(id)
	if err != nil {
		notFound(c, err.Error())
		return
	}
	ok(c, p)
}

func (h *ProductHandler) Create(c *gin.Context) {
	var req model.CreateProductReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	p, err := h.svc.Create(middleware.GetUserID(c), req)
	if err != nil {
		internal(c, err.Error())
		return
	}
	created(c, p)
}

func (h *ProductHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	var req model.UpdateProductReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	p, err := h.svc.Update(id, req)
	if err != nil {
		notFound(c, err.Error())
		return
	}
	ok(c, p)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.Delete(id); err != nil {
		notFound(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "deleted"})
}

func (h *ProductHandler) PatchStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	var req model.PatchStatusReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	if err := h.svc.PatchStatus(id, req.Status); err != nil {
		notFound(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "status updated"})
}

func (h *ProductHandler) UploadImage(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		badRequest(c, "missing image file")
		return
	}
	defer file.Close()
	img, err := h.svc.UploadImage(id, file, header)
	if err != nil {
		internal(c, err.Error())
		return
	}
	created(c, img)
}

func (h *ProductHandler) ServeImage(c *gin.Context) {
	imageID, err := uuid.Parse(c.Param("imageId"))
	if err != nil {
		badRequest(c, "invalid image id")
		return
	}
	img, err := h.svc.GetImageData(imageID)
	if err != nil {
		notFound(c, err.Error())
		return
	}
	c.Data(200, img.ContentType, img.ImageData)
}

func (h *ProductHandler) DeleteImage(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid product id")
		return
	}
	imageID, err := uuid.Parse(c.Param("imageId"))
	if err != nil {
		badRequest(c, "invalid image id")
		return
	}
	if err := h.svc.DeleteImage(productID, imageID); err != nil {
		notFound(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "image deleted"})
}

// ── Order ─────────────────────────────────────────────────────────────────────

type OrderHandler struct{ svc service.OrderService }

func NewOrderHandler(svc service.OrderService) *OrderHandler { return &OrderHandler{svc} }

func (h *OrderHandler) Create(c *gin.Context) {
	var req model.CreateOrderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	order, err := h.svc.Create(middleware.GetUserID(c), req)
	if err != nil {
		badRequest(c, err.Error())
		return
	}
	created(c, order)
}

func (h *OrderHandler) ListMine(c *gin.Context) {
	list, err := h.svc.ListMine(middleware.GetUserID(c))
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, list)
}

func (h *OrderHandler) ListAll(c *gin.Context) {
	list, err := h.svc.ListAll()
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, list)
}

func (h *OrderHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.Delete(id); err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "deleted"})
}

func (h *OrderHandler) PatchStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	var req model.PatchOrderStatusReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	if err := h.svc.PatchStatus(id, req.Status); err != nil {
		notFound(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "status updated"})
}

// ── TrialBooking ──────────────────────────────────────────────────────────────

type TrialBookingHandler struct{ svc service.TrialBookingService }

func NewTrialBookingHandler(svc service.TrialBookingService) *TrialBookingHandler {
	return &TrialBookingHandler{svc}
}

func (h *TrialBookingHandler) Create(c *gin.Context) {
	var req model.CreateTrialBookingReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	tb, err := h.svc.Create(req)
	if err != nil {
		badRequest(c, err.Error())
		return
	}
	created(c, tb)
}

func (h *TrialBookingHandler) ListAll(c *gin.Context) {
	list, err := h.svc.ListAll()
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, list)
}

func (h *TrialBookingHandler) ListMine(c *gin.Context) {
	coachID := middleware.GetUserID(c)
	list, err := h.svc.ListByCoach(coachID)
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, list)
}

func (h *TrialBookingHandler) Approve(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.Approve(id); err != nil {
		notFound(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "approved"})
}

func (h *TrialBookingHandler) Reject(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.Reject(id); err != nil {
		notFound(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "rejected"})
}

func (h *TrialBookingHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.Delete(id); err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "deleted"})
}

func (h *TrialBookingHandler) Cancel(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.RequestCancel(middleware.GetUserID(c), id); err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "cancel requested"})
}

func (h *TrialBookingHandler) ApproveCancellation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.ApproveCancellation(id); err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "cancellation approved"})
}

func (h *TrialBookingHandler) RejectCancellation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.RejectCancellation(id); err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "cancellation rejected"})
}

// ── Setting ───────────────────────────────────────────────────────────────────

type SettingHandler struct{ svc service.SystemSettingService }

func NewSettingHandler(svc service.SystemSettingService) *SettingHandler {
	return &SettingHandler{svc}
}

func (h *SettingHandler) GetTrialPassword(c *gin.Context) {
	pwd, err := h.svc.GetTrialPassword()
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, gin.H{"password": pwd})
}

func (h *SettingHandler) SetTrialPassword(c *gin.Context) {
	var req model.SetTrialPasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	if err := h.svc.SetTrialPassword(req.Password); err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "password updated"})
}

// ── Award ─────────────────────────────────────────────────────────────────────

type AwardHandler struct{ svc service.AwardService }

func NewAwardHandler(svc service.AwardService) *AwardHandler { return &AwardHandler{svc} }

func (h *AwardHandler) List(c *gin.Context) {
	list, err := h.svc.List()
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, list)
}

func (h *AwardHandler) Create(c *gin.Context) {
	var req model.CreateAwardReq
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err.Error())
		return
	}
	a, err := h.svc.Create(req)
	if err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, a)
}

func (h *AwardHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	if err := h.svc.Delete(id); err != nil {
		internal(c, err.Error())
		return
	}
	ok(c, gin.H{"message": "deleted"})
}
