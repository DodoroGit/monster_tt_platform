# Monster 桌球館管理系統 — POC

## 快速啟動

```bash
# 1. 複製環境設定
cp .env.example .env

# 2. 一鍵啟動（首次啟動會自動 build）
docker compose up --build
```

## 服務端口

| 服務 | 網址 |
|------|------|
| 前端網站 | http://localhost:3000 |
| 後端 API | http://localhost:8080/api/v1 |
| MinIO Console | http://localhost:9001 |

## 預設帳號

| 角色 | Email | 密碼 |
|------|-------|------|
| 店長 (owner) | owner@monster-tt.com | owner123456 |

> 教練/顧客帳號由店長於後台建立，或顧客自行到 /register 頁面註冊。

## 功能模組

### 模組一：官方網站 (`/`)
- 球館簡介、課程介紹、教練陣容（動態）、獲獎榮耀、聯絡資訊

### 模組二：教練預約系統 (`/booking`)
- 教練開放時段 → 顧客線上預約（先搶先得）
- 教練後台：新增/刪除時段
- 顧客後台：查看/取消預約

### 模組三：球具商城 (`/shop`)
- 店長後台：新增商品、上傳圖片、上下架
- 顧客：瀏覽商品、加入購物車、結帳（POC 不含金流）

## API 文件

Base URL: `http://localhost:8080/api/v1`

所有需要認證的 API 請在 header 加上：
```
Authorization: Bearer <token>
```

主要端點請參考 `CLAUDE.md` § 7。

## 技術棧

- **前端**：React + TypeScript + Vite + Ant Design + TanStack Query
- **後端**：Golang + Gin + GORM
- **資料庫**：PostgreSQL 16
- **物件儲存**：MinIO（S3 相容）
- **認證**：JWT (HS256)
- **容器化**：Docker Compose
