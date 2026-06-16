package router

import (
	"monster_tt/backend/handler"
	"monster_tt/backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func Setup(
	jwtSecret string,
	authH *handler.AuthHandler,
	userH *handler.UserHandler,
	coachH *handler.CoachHandler,
	availH *handler.AvailabilityHandler,
	bookingH *handler.BookingHandler,
	productH *handler.ProductHandler,
	orderH *handler.OrderHandler,
	trialH *handler.TrialBookingHandler,
	settingH *handler.SettingHandler,
	awardH *handler.AwardHandler,
) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://frontend"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	v1 := r.Group("/api/v1")

	// Auth (public)
	auth := v1.Group("/auth")
	{
		auth.POST("/register", authH.Register)
		auth.POST("/login", authH.Login)
		auth.GET("/me", middleware.JWT(jwtSecret), authH.Me)
	}

	// Coaches (public read)
	coaches := v1.Group("/coaches")
	{
		coaches.GET("", coachH.List)
		coaches.GET("/:id", coachH.GetByID)
		coaches.GET("/:id/avatar", coachH.ServeAvatar)
		coaches.GET("/:id/availabilities", availH.ListByCoach)
		coaches.PUT("/me/profile", middleware.JWT(jwtSecret),
			middleware.RequireRole("coach", "owner"), coachH.UpdateMyProfile)
		coaches.POST("/me/avatar", middleware.JWT(jwtSecret),
			middleware.RequireRole("coach", "owner"), coachH.UploadAvatar)
		coaches.POST("/me/titles", middleware.JWT(jwtSecret),
			middleware.RequireRole("coach", "owner"), coachH.AddTitle)
		coaches.PUT("/me/titles/:titleId", middleware.JWT(jwtSecret),
			middleware.RequireRole("coach", "owner"), coachH.UpdateTitle)
		coaches.DELETE("/me/titles/:titleId", middleware.JWT(jwtSecret),
			middleware.RequireRole("coach", "owner"), coachH.DeleteTitle)
		coaches.PATCH("/me/titles/reorder", middleware.JWT(jwtSecret),
			middleware.RequireRole("coach", "owner"), coachH.ReorderTitles)
	}

	// Availabilities
	avail := v1.Group("/availabilities", middleware.JWT(jwtSecret))
	{
		avail.GET("/me", middleware.RequireRole("coach"), availH.ListMine)
		avail.GET("", middleware.RequireRole("owner"), availH.ListAll)
		avail.POST("", middleware.RequireRole("coach", "owner"), availH.Create)
		avail.DELETE("/:id", middleware.RequireRole("coach", "owner"), availH.Delete)
	}

	// Bookings (auth required)
	bookings := v1.Group("/bookings", middleware.JWT(jwtSecret))
	{
		bookings.GET("", middleware.RequireRole("owner"), bookingH.ListAll)
		bookings.DELETE("/:id", middleware.RequireRole("owner"), bookingH.Delete)
		bookings.POST("", middleware.RequireRole("customer", "owner"), bookingH.Create)
		bookings.GET("/me", bookingH.ListMine)
		bookings.PATCH("/:id/cancel", bookingH.Cancel)
		bookings.PATCH("/:id/approve", middleware.RequireRole("coach"), bookingH.Approve)
		bookings.PATCH("/:id/reject", middleware.RequireRole("coach"), bookingH.Reject)
		bookings.PATCH("/:id/approve-cancel", middleware.RequireRole("owner"), bookingH.ApproveCancellation)
		bookings.PATCH("/:id/reject-cancel", middleware.RequireRole("owner"), bookingH.RejectCancellation)
		bookings.PATCH("/:id/reschedule", middleware.RequireRole("owner"), bookingH.Reschedule)
	}

	// Products (public read + image serve, owner write)
	products := v1.Group("/products")
	{
		products.GET("", productH.List)
		products.GET("/:id", productH.GetByID)
		products.GET("/:id/images/:imageId", productH.ServeImage)

		ownerProducts := products.Group("", middleware.JWT(jwtSecret), middleware.RequireRole("owner"))
		ownerProducts.POST("", productH.Create)
		ownerProducts.PUT("/:id", productH.Update)
		ownerProducts.DELETE("/:id", productH.Delete)
		ownerProducts.PATCH("/:id/status", productH.PatchStatus)
		ownerProducts.POST("/:id/images", productH.UploadImage)
		ownerProducts.DELETE("/:id/images/:imageId", productH.DeleteImage)
	}

	// Orders
	orders := v1.Group("/orders", middleware.JWT(jwtSecret))
	{
		orders.POST("", middleware.RequireRole("customer", "owner", "coach"), orderH.Create)
		orders.GET("/me", orderH.ListMine)
		orders.GET("", middleware.RequireRole("owner"), orderH.ListAll)
		orders.PATCH("/:id/status", middleware.RequireRole("owner"), orderH.PatchStatus)
		orders.DELETE("/:id", middleware.RequireRole("owner"), orderH.Delete)
	}

	// Users
	v1.PUT("/users/me", middleware.JWT(jwtSecret), userH.UpdateMyProfile)

	users := v1.Group("/users", middleware.JWT(jwtSecret), middleware.RequireRole("owner"))
	{
		users.GET("", userH.List)
		users.POST("", userH.Create)
		users.PATCH("/:id/role", userH.PatchRole)
		users.PUT("/:id", userH.UpdateByOwner)
	}

	// Trial Bookings
	v1.POST("/trial-bookings", trialH.Create) // public
	trialAuth := v1.Group("/trial-bookings", middleware.JWT(jwtSecret))
	{
		trialAuth.GET("/me", middleware.RequireRole("coach"), trialH.ListMine)
		trialAuth.GET("", middleware.RequireRole("owner"), trialH.ListAll)
		trialAuth.PATCH("/:id/approve", middleware.RequireRole("owner"), trialH.Approve)
		trialAuth.PATCH("/:id/reject", middleware.RequireRole("owner"), trialH.Reject)
		trialAuth.DELETE("/:id", middleware.RequireRole("owner"), trialH.Delete)
		trialAuth.PATCH("/:id/cancel", middleware.RequireRole("coach"), trialH.Cancel)
		trialAuth.PATCH("/:id/approve-cancel", middleware.RequireRole("owner"), trialH.ApproveCancellation)
		trialAuth.PATCH("/:id/reject-cancel", middleware.RequireRole("owner"), trialH.RejectCancellation)
	}

	// Settings (owner only)
	settings := v1.Group("/settings", middleware.JWT(jwtSecret), middleware.RequireRole("owner"))
	{
		settings.GET("/trial-password", settingH.GetTrialPassword)
		settings.PUT("/trial-password", settingH.SetTrialPassword)
	}

	// Awards (public read, owner write)
	v1.GET("/awards", awardH.List)
	ownerAwards := v1.Group("/awards", middleware.JWT(jwtSecret), middleware.RequireRole("owner"))
	{
		ownerAwards.POST("", awardH.Create)
		ownerAwards.DELETE("/:id", awardH.Delete)
	}

	return r
}
