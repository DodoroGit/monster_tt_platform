package middleware

import (
	"errors"
	"strings"

	"monster_tt/backend/model"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	KeyUserID = "userID"
	KeyRole   = "role"
)

func JWT(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			abortJSON(c, 401, "UNAUTHORIZED", "missing token")
			return
		}
		claims, err := parseJWT(strings.TrimPrefix(auth, "Bearer "), secret)
		if err != nil {
			abortJSON(c, 401, "UNAUTHORIZED", "invalid token")
			return
		}
		c.Set(KeyUserID, claims.UserID)
		c.Set(KeyRole, string(claims.Role))
		c.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}
	return func(c *gin.Context) {
		role, _ := c.Get(KeyRole)
		if _, ok := allowed[role.(string)]; !ok {
			abortJSON(c, 403, "FORBIDDEN", "insufficient permissions")
			return
		}
		c.Next()
	}
}

func GetUserID(c *gin.Context) uuid.UUID { return c.MustGet(KeyUserID).(uuid.UUID) }
func GetRole(c *gin.Context) string      { return c.MustGet(KeyRole).(string) }

func parseJWT(tokenStr, secret string) (*model.JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &model.JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*model.JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

func abortJSON(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, gin.H{
		"data":  nil,
		"error": gin.H{"code": code, "message": message},
	})
}
