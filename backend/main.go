package main

import (
	"fmt"
	"log"

	"monster_tt/backend/config"
	"monster_tt/backend/handler"
	"monster_tt/backend/model"
	"monster_tt/backend/repository"
	"monster_tt/backend/router"
	"monster_tt/backend/service"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Taipei",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}

	if err := db.AutoMigrate(
		&model.User{},
		&model.CoachProfile{},
		&model.CoachTitle{},
		&model.CoachAvailability{},
		&model.Booking{},
		&model.Product{},
		&model.ProductImage{},
		&model.Order{},
		&model.OrderItem{},
		&model.TrialBooking{},
		&model.SystemSetting{},
		&model.Award{},
	); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	seedOwner(db, cfg)

	userRepo := repository.NewUserRepo(db)
	coachRepo := repository.NewCoachRepo(db)
	availRepo := repository.NewAvailabilityRepo(db)
	bookingRepo := repository.NewBookingRepo(db)
	productRepo := repository.NewProductRepo(db)
	orderRepo := repository.NewOrderRepo(db)
	trialRepo := repository.NewTrialBookingRepo(db)
	settingRepo := repository.NewSystemSettingRepo(db)
	awardRepo := repository.NewAwardRepo(db)

	authSvc := service.NewAuthService(userRepo, cfg.JWTSecret)
	userSvc := service.NewUserService(userRepo)
	coachSvc := service.NewCoachService(coachRepo)
	availSvc := service.NewAvailabilityService(availRepo)
	bookingSvc := service.NewBookingService(bookingRepo, availRepo, trialRepo, db)
	productSvc := service.NewProductService(productRepo)
	orderSvc := service.NewOrderService(orderRepo, productRepo, db)
	trialSvc := service.NewTrialBookingService(trialRepo, availRepo, settingRepo)
	settingSvc := service.NewSystemSettingService(settingRepo)
	awardSvc := service.NewAwardService(awardRepo)

	authH := handler.NewAuthHandler(authSvc, userRepo)
	userH := handler.NewUserHandler(userSvc)
	coachH := handler.NewCoachHandler(coachSvc)
	availH := handler.NewAvailabilityHandler(availSvc, coachRepo)
	bookingH := handler.NewBookingHandler(bookingSvc)
	productH := handler.NewProductHandler(productSvc)
	orderH := handler.NewOrderHandler(orderSvc)
	trialH := handler.NewTrialBookingHandler(trialSvc)
	settingH := handler.NewSettingHandler(settingSvc)
	awardH := handler.NewAwardHandler(awardSvc)

	r := router.Setup(cfg.JWTSecret, authH, userH, coachH, availH, bookingH, productH, orderH, trialH, settingH, awardH)
	log.Println("server running on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}

func seedOwner(db *gorm.DB, cfg *config.Config) {
	var count int64
	db.Model(&model.User{}).Where("phone = ?", cfg.SeedOwnerPhone).Count(&count)
	if count > 0 {
		return
	}
	owner := model.User{
		Name:  cfg.SeedOwnerName,
		Phone: cfg.SeedOwnerPhone,
		Role:  model.RoleOwner,
	}
	if err := db.Create(&owner).Error; err != nil {
		log.Printf("seed owner create error: %v", err)
		return
	}
	log.Printf("seed owner created: %s (%s)", cfg.SeedOwnerName, cfg.SeedOwnerPhone)
}
