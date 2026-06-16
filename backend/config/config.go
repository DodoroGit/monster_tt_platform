package config

import "os"

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	JWTSecret string

	SeedOwnerName  string
	SeedOwnerPhone string
}

func Load() *Config {
	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "monster_tt"),
		DBPassword: getEnv("DB_PASSWORD", "monster_tt_pass"),
		DBName:     getEnv("DB_NAME", "monster_tt_db"),

		JWTSecret: getEnv("JWT_SECRET", "dev-secret"),

		SeedOwnerName:  getEnv("SEED_OWNER_NAME", "店長"),
		SeedOwnerPhone: getEnv("SEED_OWNER_PHONE", "0900000000"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
