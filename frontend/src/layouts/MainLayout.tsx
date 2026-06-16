import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Space, Badge, Dropdown } from 'antd'
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/store/auth'
import { useCartStore } from '@/store/cart'

const { Header, Content, Footer } = Layout

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const cartCount = useCartStore((items) => items.length)

  const navItems = [
    { key: '/', label: <Link to="/">首頁</Link> },
    { key: '/booking', label: <Link to="/booking">預約教練</Link> },
    { key: '/shop', label: <Link to="/shop">球具商城</Link> },
    { key: '/contact', label: <Link to="/contact">聯絡我們</Link> },
  ]

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

  const activeKey =
    location.pathname === '/'
      ? '/'
      : navItems.find((n) => n.key !== '/' && location.pathname.startsWith(n.key))?.key ?? '/'

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
          padding: '0 32px',
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
          <div
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #059669, #10B981)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            🏓
          </div>
          <span
            style={{
              color: 'white',
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '-0.3px',
              lineHeight: 1,
            }}
          >
            小怪獸
            <span style={{ color: '#10B981', marginLeft: 4 }}>桌球</span>
          </span>
        </Link>

        {/* Nav */}
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
                }}
              >
                <UserOutlined />
                {user.name}
              </Button>
            </Dropdown>
          ) : (
            <>
              <Button
                onClick={() => navigate('/login')}
                type="text"
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: 500,
                  height: 40,
                }}
              >
                登入
              </Button>
              <Button
                onClick={() => navigate('/register')}
                type="primary"
                style={{ height: 40, fontWeight: 600, borderRadius: 8 }}
              >
                免費註冊
              </Button>
            </>
          )}
        </Space>
      </Header>

      <Content style={{ background: '#F1F5F9' }}>
        <Outlet />
      </Content>

      <Footer
        style={{
          background: '#0F172A',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '48px 32px 32px',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #059669, #10B981)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              🏓
            </div>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>小怪獸桌球</span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 24,
              marginBottom: 32,
              flexWrap: 'wrap',
            }}
          >
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
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.5)')
                }
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
