import { Button, InputNumber, Typography, Divider, message, Empty, Modal } from 'antd'
import { DeleteOutlined, ShoppingOutlined, ArrowRightOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useCartStore, cartStore } from '@/store/cart'
import { ordersApi } from '@/api/orders'
import { useAuth } from '@/store/auth'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { CartItem } from '@/types'

const { Title, Text } = Typography

function CartRow({ item }: { item: CartItem }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        background: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        padding: '18px 24px',
        marginBottom: 12,
        transition: 'box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')
      }
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}
    >
      {/* Product image / placeholder */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 10,
          overflow: 'hidden',
          flexShrink: 0,
          background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          border: '1px solid #E2E8F0',
        }}
      >
        {item.product.images?.[0]?.image_url ? (
          <img
            src={item.product.images[0].image_url}
            alt={item.product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          '🏓'
        )}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text
          strong
          style={{ fontSize: 15, color: '#0F172A', display: 'block', marginBottom: 4 }}
          ellipsis
        >
          {item.product.name}
        </Text>
        <Text style={{ fontSize: 13, color: '#64748B' }}>
          單價 NT$ {Number(item.product.price).toLocaleString()}
        </Text>
      </div>

      {/* Quantity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Text style={{ fontSize: 12, color: '#94A3B8' }}>數量</Text>
        <InputNumber
          min={1}
          max={item.product.stock}
          value={item.quantity}
          onChange={(v) => cartStore.updateQuantity(item.product.id, v ?? 1)}
          style={{ width: 72, borderRadius: 8 }}
          size="small"
        />
      </div>

      {/* Subtotal */}
      <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 100 }}>
        <Text strong style={{ fontSize: 16, color: '#059669' }}>
          NT$ {(Number(item.product.price) * item.quantity).toLocaleString()}
        </Text>
      </div>

      {/* Delete */}
      <Button
        type="text"
        danger
        icon={<DeleteOutlined />}
        onClick={() => cartStore.removeItem(item.product.id)}
        style={{ flexShrink: 0, borderRadius: 8 }}
      />
    </div>
  )
}

export default function CartPage() {
  const items = useCartStore((i) => i)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const total = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0)

  const checkout = async () => {
    if (!user) { navigate('/login'); return }
    if (!items.length) { message.warning('購物車是空的'); return }
    setLoading(true)
    try {
      const res = await ordersApi.create(
        items.map((i) => ({ product_id: i.product.id, quantity: i.quantity }))
      )
      if (res.error) throw new Error(res.error.message)
      cartStore.clear()
      Modal.success({
        title: '訂單已成立！',
        icon: <CheckCircleOutlined style={{ color: '#059669' }} />,
        content: (
          <div style={{ lineHeight: 1.8, marginTop: 8 }}>
            <p style={{ margin: '0 0 8px' }}>
              感謝您的訂購！請確認您的<strong>手機號碼</strong>及<strong>個人資訊</strong>正確，我們將有專人主動與您聯繫，確認訂單細節與取貨方式。
            </p>
            <p style={{ margin: 0, color: '#64748B', fontSize: 13 }}>
              您可至「個人頁面 → 我的訂單」隨時查詢訂單目前狀態。
            </p>
          </div>
        ),
        okText: '我知道了',
        onOk: () => navigate('/dashboard'),
      })
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '結帳失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div
        style={{
          background: 'linear-gradient(140deg, #0F172A 0%, #1E3A5F 100%)',
          padding: '56px 32px 52px',
        }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: 'rgba(5,150,105,0.2)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingOutlined style={{ color: '#10B981', fontSize: 22 }} />
            </div>
            <div>
              <Title
                level={2}
                style={{ color: 'white', margin: 0, fontWeight: 900, letterSpacing: '-0.5px' }}
              >
                購物車
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                {items.length} 件商品
              </Text>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px' }}>
        {items.length === 0 ? (
          <div
            style={{
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              padding: '80px 24px',
              textAlign: 'center',
            }}
          >
            <Empty
              description={
                <div>
                  <Text style={{ color: '#64748B', fontSize: 16, display: 'block', marginBottom: 16 }}>
                    購物車是空的
                  </Text>
                  <Button
                    type="primary"
                    onClick={() => navigate('/shop')}
                    style={{ borderRadius: 8, height: 42, fontWeight: 600 }}
                  >
                    去逛逛商城
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              {items.map((item) => (
                <CartRow key={item.product.id} item={item} />
              ))}
            </div>

            <div
              style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: 16,
                padding: '28px 32px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                }}
              >
                <Text style={{ fontSize: 15, color: '#64748B' }}>
                  共 {items.reduce((s, i) => s + i.quantity, 0)} 件商品
                </Text>
                <div style={{ textAlign: 'right' }}>
                  <Text style={{ fontSize: 14, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    訂單總計
                  </Text>
                  <Text
                    strong
                    style={{ fontSize: 28, color: '#059669', letterSpacing: '-1px' }}
                  >
                    NT$ {total.toLocaleString()}
                  </Text>
                </div>
              </div>

              <Divider style={{ margin: '16px 0' }} />

              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  onClick={() => navigate('/shop')}
                  style={{ flex: 1, height: 48, borderRadius: 10, fontWeight: 600 }}
                >
                  繼續購物
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  loading={loading}
                  disabled={!items.length}
                  onClick={checkout}
                  style={{
                    flex: 2,
                    height: 48,
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 16,
                    boxShadow: '0 4px 16px rgba(5,150,105,0.35)',
                  }}
                >
                  確認結帳
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
