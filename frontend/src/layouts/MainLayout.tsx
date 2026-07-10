import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Space, Badge, Dropdown, Drawer, Grid } from 'antd'
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  MenuOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/store/auth'
import { useCartStore } from '@/store/cart'

const { Header, Content, Footer } = Layout
const { useBreakpoint } = Grid

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const cartCount = useCartStore((items) => items.length)
  const screens = useBreakpoint()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isMobile = !screens.md

  const navItems = [
    { key: '/', label: <Link to="/">首頁</Link> },
    { key: '/booking', label: <Link to="/booking">預約教練</Link> },
    { key: '/shop', label: <Link to="/shop">球具商城</Link> },
    { key: '/contact', label: <Link to="/contact">聯絡我們</Link> },
    ...(user?.role === 'owner' ? [{ key: '/guide', label: <Link to="/guide">系統說明</Link> }] : []),
  ]

  const activeKey =
    location.pathname === '/'
      ? '/'
      : navItems.find((n) => n.key !== '/' && location.pathname.startsWith(n.key))?.key ?? '/'

  const userMenuItems = user
    ? [
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: '個人後台',
          onClick: () => navigate('/dashboard'),
        },
        { type: 'divider' as const },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: '登出',
          onClick: logout,
          danger: true,
        },
      ]
    : []

  const handleNavClick = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(15,23,42,0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: isMobile ? '0 16px' : '0 32px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 24px rgba(0,0,0,0.32)',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <img
            src="/logo.jpg"
            alt="小怪獸桌球"
            style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }}
          />
          <span
            style={{
              color: 'white',
              fontWeight: 800,
              fontSize: isMobile ? 16 : 18,
              letterSpacing: '-0.3px',
              lineHeight: 1,
            }}
          >
            小怪獸
            <span style={{ color: '#10B981', marginLeft: 4 }}>桌球</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        {!isMobile && (
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[activeKey]}
            items={navItems}
            style={{
              flex: 1,
              marginLeft: 40,
              background: 'transparent',
              border: 'none',
              fontSize: 15,
            }}
          />
        )}

        {/* Actions */}
        <Space size={8}>
          <Badge count={cartCount} size="small" offset={[-2, 2]}>
            <Button
              icon={<ShoppingCartOutlined style={{ fontSize: 18 }} />}
              onClick={() => navigate('/shop/cart')}
              type="text"
              style={{
                color: 'rgba(255,255,255,0.8)',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Badge>

          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Button
                type="text"
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontWeight: 500,
                  maxWidth: isMobile ? 120 : 'none',
                  overflow: 'hidden',
                }}
              >
                <UserOutlined />
                {!isMobile && user.name}
              </Button>
            </Dropdown>
          ) : (
            <>
              {!isMobile && (
                <Button
                  onClick={() => navigate('/login')}
                  type="text"
                  style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, height: 40 }}
                >
                  登入
                </Button>
              )}
              {!isMobile && (
                <Button
                  onClick={() => navigate('/register')}
                  type="primary"
                  style={{ height: 40, fontWeight: 600, borderRadius: 8 }}
                >
                  註冊
                </Button>
              )}
            </>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <Button
              icon={<MenuOutlined style={{ fontSize: 18 }} />}
              type="text"
              onClick={() => setDrawerOpen(true)}
              style={{
                color: 'rgba(255,255,255,0.8)',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          )}
        </Space>
      </Header>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <span style={{ fontWeight: 800, fontSize: 16 }}>
            小怪獸<span style={{ color: '#10B981', marginLeft: 4 }}>桌球</span>
          </span>
        }
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={260}
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          style={{ border: 'none', fontSize: 15 }}
          items={[
            { key: '/', label: '首頁', onClick: () => handleNavClick('/') },
            { key: '/booking', label: '預約教練', onClick: () => handleNavClick('/booking') },
            { key: '/shop', label: '球具商城', onClick: () => handleNavClick('/shop') },
            { key: '/contact', label: '聯絡我們', onClick: () => handleNavClick('/contact') },
            ...(user?.role === 'owner'
              ? [{ key: '/guide', label: '系統說明', onClick: () => handleNavClick('/guide') }]
              : []),
          ]}
        />
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
          {user ? (
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Button
                block
                icon={<DashboardOutlined />}
                onClick={() => { navigate('/dashboard'); setDrawerOpen(false) }}
              >
                個人後台
              </Button>
              <Button block danger onClick={() => { logout(); setDrawerOpen(false) }}>
                登出
              </Button>
            </Space>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Button
                block
                onClick={() => { navigate('/login'); setDrawerOpen(false) }}
              >
                登入
              </Button>
              <Button
                block
                type="primary"
                onClick={() => { navigate('/register'); setDrawerOpen(false) }}
              >
                註冊
              </Button>
            </Space>
          )}
        </div>
      </Drawer>

      <Content style={{ background: '#F1F5F9' }}>
        <Outlet />
      </Content>

      <Footer
        style={{
          background: '#0F172A',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: isMobile ? '32px 16px 24px' : '48px 32px 32px',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <img
              src="/logo.jpg"
              alt="小怪獸桌球"
              style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
            />
            <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>小怪獸桌球</span>
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
            {[
              { to: '/', label: '首頁' },
              { to: '/booking', label: '預約教練' },
              { to: '/shop', label: '球具商城' },
              { to: '/contact', label: '聯絡我們' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#10B981')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.5)')}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              paddingTop: 20,
              color: 'rgba(255,255,255,0.3)',
              fontSize: 13,
            }}
          >
            © {new Date().getFullYear()} 小怪獸桌球 · All rights reserved
          </div>
        </div>
      </Footer>
    </Layout>
  )
}
