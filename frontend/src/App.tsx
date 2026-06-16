import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhTW from 'antd/locale/zh_TW'
import { AuthProvider } from '@/store/auth'
import { ProtectedRoute } from '@/router/index'
import MainLayout from '@/layouts/MainLayout'
import HomePage from '@/pages/home/index'
import ContactPage from '@/pages/contact/index'
import LoginPage from '@/pages/auth/Login'
import RegisterPage from '@/pages/auth/Register'
import BookingPage from '@/pages/booking/index'
import CoachDetailPage from '@/pages/booking/CoachDetail'
import ShopPage from '@/pages/shop/index'
import ProductDetailPage from '@/pages/shop/ProductDetail'
import CartPage from '@/pages/shop/Cart'
import DashboardPage from '@/pages/dashboard/index'

const qc = new QueryClient()

const theme = {
  token: {
    colorPrimary: '#059669',
    colorSuccess: '#10B981',
    colorError: '#EF4444',
    colorWarning: '#F59E0B',
    borderRadius: 10,
    borderRadiusLG: 14,
    fontFamily: "'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    colorBgLayout: '#F1F5F9',
    controlHeight: 40,
  },
  components: {
    Layout: {
      headerBg: '#0F172A',
      footerBg: '#0F172A',
      bodyBg: '#F1F5F9',
      headerHeight: 68,
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: 'transparent',
      darkItemSelectedColor: '#10B981',
      darkItemHoverColor: '#ffffff',
      darkItemColor: 'rgba(255,255,255,0.72)',
      darkPopupBg: '#1E293B',
      horizontalItemSelectedColor: '#10B981',
      horizontalItemHoverColor: '#ffffff',
    },
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      fontWeight: 600,
    },
    Card: {
      borderRadius: 14,
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Tag: {
      borderRadius: 100,
    },
  },
}

export default function App() {
  return (
    <ConfigProvider theme={theme} locale={zhTW}>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/booking/:id" element={<CoachDetailPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/shop/cart" element={<CartPage />} />
                <Route path="/shop/:id" element={<ProductDetailPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ConfigProvider>
  )
}
