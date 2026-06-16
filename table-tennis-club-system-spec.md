# 桌球館管理系統 — 規格書 (SPEC)

> 版本: v0.1 (草案)
> 用途: 本文件作為 Claude Code AI Agent 產生完整專案的輸入。請依本規格產生可在本地端透過 Docker Compose 一鍵啟動的 POC 系統。
> 凡標註 **[預設]** 之項目為在需求未明確時所採用的合理預設值,可被覆寫。

---

## 1. 專案概述

為桌球館建置一套 Web 系統,涵蓋三大功能模組:

1. **官方網站 (Official Website)** — 對外形象與資訊展示。
2. **教練預約系統 (Coach Booking)** — 教練開放時段、學員/顧客線上預約媒合。
3. **球具商城 (Equipment Shop)** — 店長自行上架商品(含圖片、價格),顧客瀏覽選購。

系統採 RBAC,共三種角色:**店長 (owner)**、**教練 (coach)**、**一般顧客 (customer)**。

目前階段為 **POC**,僅需本地端 (local) 透過 Docker Compose 部署;未來保留遷移至 AWS / 其他雲端的彈性(見 §10)。

---

## 2. 技術棧 (Tech Stack)

| 層級 | 技術 | 備註 |
|---|---|---|
| 前端 | **React + TypeScript** | 建置工具使用 **Vite** [預設] |
| 前端路由 | **React Router** | |
| 前端 server state | **TanStack Query (React Query)** [預設] | 處理快取、loading、錯誤 |
| 前端 auth state | **React Context** (輕量,POC 足夠) [預設] | |
| 前端 UI 元件 | **Ant Design (antd)** [預設] | 預約日曆、表單、檔案上傳、表格現成可用,加速 POC;可替換為 Tailwind + 自製元件 |
| 後端 | **Golang** + **Gin** [預設] | HTTP framework |
| ORM | **GORM** [預設] | repository 層使用 |
| 資料庫 | **PostgreSQL 16** | |
| 物件儲存 | **MinIO** (S3 相容) [預設] | 存商品圖片;未來可無痛換 AWS S3,見 §10 |
| 認證 | **JWT (access token)** [預設] | bearer token,POC 可不做 refresh token |
| 資料庫 migration | **golang-migrate** (版本化 SQL) [預設] | 亦可改用 GORM AutoMigrate 求最快 POC |
| 容器化 | **Docker + Docker Compose** | |

---

## 3. 系統架構

### 3.1 後端三層式架構 (強制)

依賴方向嚴格單向:`handler → service → repository`

- **handler 層**: 處理 HTTP 請求/回應、參數綁定與驗證、呼叫 service、組裝回應。**不得**直接存取資料庫。
- **service 層**: 業務邏輯、交易控制、權限相關判斷、組合多個 repository。**不得**直接接觸 `*gin.Context` 或 HTTP 概念。
- **repository 層**: 僅負責資料存取 (GORM / SQL)。**不得**包含業務邏輯。

各層之間以 interface 解耦,並用建構式注入 (constructor injection) 傳遞依賴。

### 3.2 後端目錄結構 [預設]

```
backend/
├── cmd/server/main.go        # 進入點:載入 config、初始化 DB/MinIO、註冊路由、啟動
├── internal/
│   ├── config/               # 環境變數載入
│   ├── router/               # 路由註冊
│   ├── middleware/           # JWT 驗證、RBAC、CORS、logging、recovery
│   ├── handler/              # HTTP handler
│   ├── service/              # 業務邏輯
│   ├── repository/           # 資料存取 (GORM)
│   ├── model/                # 領域模型 / GORM entity
│   ├── dto/                  # request / response 結構
│   └── storage/              # MinIO/S3 client 抽象 (interface)
├── pkg/                      # 共用工具 (jwt, password hash, http response helper)
├── migrations/               # 版本化 SQL migration 檔
├── Dockerfile
├── .env.example
├── go.mod
└── go.sum
```

### 3.3 前端目錄結構 [預設]

```
frontend/
├── src/
│   ├── api/                  # axios 實例 + 各模組 API 呼叫
│   ├── components/           # 共用元件
│   ├── layouts/              # 版面 (含頁首導覽列、頁尾)
│   ├── pages/
│   │   ├── home/             # 模組一:官方網站
│   │   ├── booking/          # 模組二:教練預約系統
│   │   └── shop/             # 模組三:球具商城
│   ├── hooks/
│   ├── store/                # auth context / 全域狀態
│   ├── types/                # TypeScript 型別
│   ├── router/               # 路由設定 + 受保護路由 (ProtectedRoute by role)
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── Dockerfile                # 建置後以 nginx 提供靜態檔
└── .env.example
```

### 3.4 Docker Compose 服務 [預設]

| service | image / build | 說明 |
|---|---|---|
| `db` | `postgres:16` | 掛載 named volume 持久化 |
| `minio` | `minio/minio` | 物件儲存,開放 API(9000)與 console(9001) |
| `minio-init` | `minio/mc` | 啟動時自動建立 bucket(如 `product-images`)並設權限 |
| `backend` | build `./backend` | 依賴 db、minio |
| `frontend` | build `./frontend` | nginx 提供靜態檔,並 reverse proxy `/api` → backend |

所有 secret/連線資訊以環境變數注入,不寫死於程式碼。提供 `.env.example`,實際 `.env` 須列入 `.gitignore`(避免憑證外洩)。

---

## 4. RBAC 權限設計

三種登入角色 + 未登入訪客 (guest)。`role` 以 PostgreSQL enum 表示:`'owner' | 'coach' | 'customer'`。

| 功能 | 店長 owner | 教練 coach | 顧客 customer | 訪客 guest |
|---|:---:|:---:|:---:|:---:|
| 瀏覽官網 / 教練陣容 / 商品 | ✓ | ✓ | ✓ | ✓ |
| 註冊 (自助) | — | — | ✓ | ✓ |
| 登入 | ✓ | ✓ | ✓ | — |
| 設定/取消 自己的可預約時段 | — | ✓ | — | — |
| 預約教練時段 | ✓ | — | ✓ | — |
| 查看自己的預約 | ✓ | ✓(收到的) | ✓(送出的) | — |
| 編輯教練個人檔案 (bio/照片) | ✓ | ✓(自己) | — | — |
| 上架/編輯/下架 商品 | ✓ | — | — | — |
| 上傳商品圖片 | ✓ | — | — | — |
| 下單購買 | ✓ | ✓ | ✓ | — |
| 管理訂單 | ✓ | — | — | — |
| 建立帳號 / 指派角色 | ✓ | — | — | — |

實作方式:JWT payload 內含 `user_id` 與 `role`;middleware 先驗 token,再以 `RequireRole(...)` 檢查角色。

**帳號建立規則** [預設]:顧客可自助註冊(預設角色 `customer`);**教練與店長帳號由店長於後台建立或指派角色**。系統需有一個 **seed 的初始店長帳號**(由環境變數設定 email/密碼,啟動時若不存在則建立)。

---

## 5. 功能模組

### 5.1 模組一:官方網站

對外公開頁面,無需登入即可瀏覽。POC 階段內容 **以靜態 placeholder 為主**(實際文案後補)[預設]。

頁面區塊:
- **首頁 / 一覽**: 球館簡介、主視覺。
- **課程介紹**: 課程列表(靜態內容)。
- **教練陣容**: **可串接系統內 `coach` 帳號的個人檔案**(姓名、專長、簡介、照片)動態呈現 [預設];亦可先靜態。
- **獲獎榮耀**: 靜態列表。
- **聯絡我們**: 球館地址、電話、營業時間、聯絡表單(POC 可僅顯示資訊,不一定送出)。

### 5.2 模組二:教練預約系統

需登入。核心為「教練開時段 → 顧客預約媒合」。

使用者故事:
- 身為**教練**,我可以在時間表上新增/刪除我可授課的時段(指定起訖時間)。
- 身為**顧客**,我可以瀏覽某教練的可預約時段,選擇一個進行預約。
- 預約成立後,該時段被鎖定,其他人不可再約。
- 顧客可查看/取消自己的預約;教練可查看收到的預約。

**預約流程** [預設]:顧客預約後 **直接成立 (slot 立即鎖定,first-come-first-served)**,狀態 `confirmed`;不需教練二次確認。**時段長度由教練自由設定起訖時間**(非固定 1 小時格)。

### 5.3 模組三:球具商城

- 身為**店長**,我可以新增商品(名稱、描述、價格、庫存)、上傳一至多張圖片、設定上架/下架。
- 身為**顧客**,我可以瀏覽上架商品、查看詳情。

**購物流程** [預設]:提供 **基本購物車 + 下單**(產生訂單紀錄,狀態 `pending`),店長可於後台檢視訂單。**POC 階段不串接金流 (payment gateway)**,付款標記為「待整合」(future)。圖片上傳至 MinIO,回傳 URL 存於 DB。

---

## 6. 資料模型 (PostgreSQL)

> 主鍵採 `UUID` (`gen_random_uuid()`);時間欄位採 `TIMESTAMPTZ`;金額採 `NUMERIC(10,2)`。

```
users
  id              UUID PK
  email           VARCHAR UNIQUE NOT NULL
  password_hash   VARCHAR NOT NULL
  name            VARCHAR NOT NULL
  phone           VARCHAR
  role            user_role NOT NULL DEFAULT 'customer'   -- enum: owner|coach|customer
  created_at, updated_at TIMESTAMPTZ

coach_profiles            -- 教練陣容展示用
  id              UUID PK
  user_id         UUID FK→users UNIQUE
  bio             TEXT
  specialty       VARCHAR
  years_exp       INT
  avatar_url      VARCHAR
  created_at, updated_at

coach_availabilities      -- 教練開放時段
  id              UUID PK
  coach_id        UUID FK→users
  start_time      TIMESTAMPTZ NOT NULL
  end_time        TIMESTAMPTZ NOT NULL
  status          VARCHAR NOT NULL DEFAULT 'available'   -- available|booked|cancelled
  created_at, updated_at

bookings                  -- 預約
  id              UUID PK
  availability_id UUID FK→coach_availabilities UNIQUE     -- 一時段一預約
  customer_id     UUID FK→users
  coach_id        UUID FK→users
  status          VARCHAR NOT NULL DEFAULT 'confirmed'    -- confirmed|cancelled|completed
  note            TEXT
  created_at, updated_at

products
  id              UUID PK
  name            VARCHAR NOT NULL
  description     TEXT
  price           NUMERIC(10,2) NOT NULL
  stock           INT NOT NULL DEFAULT 0
  status          VARCHAR NOT NULL DEFAULT 'off_shelf'    -- on_shelf|off_shelf
  created_by      UUID FK→users
  created_at, updated_at

product_images
  id              UUID PK
  product_id      UUID FK→products
  image_url       VARCHAR NOT NULL
  sort_order      INT DEFAULT 0
  created_at

orders                    -- POC:不含真實金流
  id              UUID PK
  customer_id     UUID FK→users
  total_amount    NUMERIC(10,2) NOT NULL
  status          VARCHAR NOT NULL DEFAULT 'pending'      -- pending|paid|completed|cancelled
  created_at, updated_at

order_items
  id              UUID PK
  order_id        UUID FK→orders
  product_id      UUID FK→products
  quantity        INT NOT NULL
  unit_price      NUMERIC(10,2) NOT NULL                  -- 下單當下價格快照
```

預約鎖定:`bookings.availability_id` 設 UNIQUE,並在 service 層以交易(transaction)同時更新 `coach_availabilities.status = 'booked'`,避免併發重複預約。

---

## 7. API 設計 (RESTful, prefix `/api/v1`)

回應統一格式 [預設]:`{ "data": ..., "error": null }` / 錯誤時 `{ "data": null, "error": { "code", "message" } }`。

**Auth**
```
POST   /auth/register          顧客自助註冊
POST   /auth/login             回傳 JWT
GET    /auth/me                取得當前使用者 (需登入)
```

**Users (店長)**
```
GET    /users                  列表
POST   /users                  建立教練/店長帳號
PATCH  /users/:id/role         指派角色
```

**Coaches / 個人檔案**
```
GET    /coaches                公開:教練陣容
GET    /coaches/:id            公開:單一教練
PUT    /coaches/me/profile     教練編輯自己的檔案
```

**Availabilities (時段)**
```
GET    /coaches/:id/availabilities?from=&to=   瀏覽某教練可預約時段
GET    /availabilities/me                      教練查看自己的時段
POST   /availabilities                         教練新增時段
DELETE /availabilities/:id                     教練刪除自己的時段
```

**Bookings (預約)**
```
POST   /bookings                顧客預約 (body: availability_id)
GET    /bookings/me             顧客:自己送出的;教練:自己收到的
PATCH  /bookings/:id/cancel     取消
```

**Products (商品)**
```
GET    /products                公開:僅 on_shelf
GET    /products/:id            公開:商品詳情
POST   /products                店長:新增
PUT    /products/:id            店長:編輯
DELETE /products/:id            店長:刪除
PATCH  /products/:id/status     店長:上/下架
POST   /products/:id/images     店長:multipart 上傳圖片 → MinIO,回傳 URL
DELETE /products/:id/images/:imageId  店長:刪圖
```

**Orders (訂單,POC)**
```
POST   /orders                  顧客:結帳 (body: items[])
GET    /orders/me               顧客:自己的訂單
GET    /orders                  店長:全部訂單
PATCH  /orders/:id/status       店長:更新訂單狀態
```

---

## 8. 認證與安全 [預設]

- 密碼以 **bcrypt** 雜湊儲存,絕不明文。
- JWT 以 HS256 簽署,secret 由環境變數提供;token 含 `user_id`、`role`、`exp`。
- 所有需登入之 API 經 JWT middleware;敏感操作再經 RBAC middleware。
- CORS 僅允許前端來源 (POC 可設 localhost)。
- `.env` 不入版控;提供 `.env.example` 範本。

---

## 9. 開發規範 (給 AI agent;亦可抽成 CLAUDE.md)

- 後端嚴守 §3.1 三層式架構與依賴方向;各層以 interface 解耦。
- **本專案不需撰寫測試 (no unit/integration tests)。**
- 命名:Go 用 idiomatic Go(exported PascalCase、package 小寫);TS 用 camelCase、型別/元件 PascalCase。
- 錯誤處理:service 層回傳具語意的錯誤,handler 層轉成對應 HTTP status code。
- 每個模組 (auth/coach/booking/product/order) 在各層各自獨立檔案。
- 提供根目錄 `docker-compose.yml`,`docker compose up` 後即可:DB 自動 migrate、MinIO bucket 自動建立、seed 初始店長、前後端可連通。
- 提供 `README.md`:啟動步驟、預設店長帳密、各服務 port、API 簡介。

---

## 10. 未來擴充 (非 POC 範圍,僅保留彈性)

- **雲端遷移**: `storage` 層以 interface 抽象,MinIO 與 AWS S3 皆為 S3 相容,未來僅需更換 endpoint/credentials 即可切換至 S3;DB 可遷移至 RDS。
- **金流串接**: orders 已預留 `status`,未來接綠界/藍新等金流。
- **官網 CMS**: 未來可將官網內容改為店長後台可編輯。
- **預約進階**: 教練確認流程、提醒通知、重複時段範本等。

---

## 11. 待釐清事項 (TODO — 由需求方確認後更新本規格)

見對話中的提問清單;確認後請更新對應 [預設] 標註之段落。
