import { Row, Col, Card, Typography, Button, Tag, InputNumber, message, Empty, Skeleton } from 'antd'
import { ShoppingCartOutlined, ShopOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { cartStore } from '@/store/cart'
import { useState } from 'react'
import type { Product } from '@/types'
import { useNavigate } from 'react-router-dom'

const { Title, Paragraph, Text } = Typography

function ProductCard({ product }: { product: Product }) {
  const [qty, setQty] = useState(1)
  const navigate = useNavigate()
  const inStock = product.stock > 0

  const addToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    cartStore.addItem(product, qty)
    message.success(`已加入購物車：${product.name} x${qty}`)
  }

  return (
    <Card
      className="hover-lift"
      style={{ border: '1px solid #E2E8F0', cursor: 'pointer' }}
      bodyStyle={{ padding: 0 }}
      onClick={() => navigate(`/shop/${product.id}`)}
      cover={
        <div className="product-img-wrap" style={{ borderRadius: '14px 14px 0 0', overflow: 'hidden' }}>
          {product.images?.[0]?.image_url ? (
            <img
              src={product.images[0].image_url}
              alt={product.name}
              style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div
              className="img-placeholder"
              style={{
                height: 220,
                background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 56,
              }}
            >
              🏓
            </div>
          )}
          {!inStock && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'rgba(15,23,42,0.75)',
                color: 'white',
                borderRadius: 6,
                padding: '3px 10px',
                fontSize: 12,
                fontWeight: 600,
                backdropFilter: 'blur(4px)',
              }}
            >
              缺貨
            </div>
          )}
        </div>
      }
    >
      <div style={{ padding: '20px 22px' }}>
        <Title
          level={5}
          style={{
            marginBottom: 6,
            fontWeight: 700,
            color: '#0F172A',
            fontSize: 16,
            lineHeight: 1.4,
          }}
          ellipsis
        >
          {product.name}
        </Title>

        {product.description && (
          <Paragraph
            ellipsis={{ rows: 2 }}
            style={{ color: '#64748B', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}
          >
            {product.description}
          </Paragraph>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text
            strong
            style={{ fontSize: 20, color: '#059669', letterSpacing: '-0.5px' }}
          >
            NT$ {Number(product.price).toLocaleString()}
          </Text>
          <Tag color={inStock ? 'green' : 'default'} style={{ marginBottom: 0 }}>
            {inStock ? `庫存 ${product.stock}` : '缺貨'}
          </Tag>
        </div>

        <div
          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          <InputNumber
            min={1}
            max={product.stock}
            value={qty}
            onChange={(v) => setQty(v ?? 1)}
            disabled={!inStock}
            style={{ width: 68, borderRadius: 8 }}
            size="small"
          />
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={addToCart}
            disabled={!inStock}
            style={{ flex: 1, borderRadius: 8, fontWeight: 600 }}
          >
            加入購物車
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function ShopPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list(),
  })

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          background: 'linear-gradient(140deg, #0F172A 0%, #1E3A5F 100%)',
          padding: '56px 32px 52px',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(5,150,105,0.15)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 100,
              padding: '5px 16px',
              marginBottom: 20,
            }}
          >
            <ShopOutlined style={{ color: '#10B981', fontSize: 13 }} />
            <Text style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>球具商城</Text>
          </div>
          <Title
            level={1}
            style={{
              color: 'white',
              fontWeight: 900,
              letterSpacing: '-1px',
              marginBottom: 12,
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            }}
          >
            精選桌球器材
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, margin: 0 }}>
            專業器材嚴選，提升您的競技水準
          </Paragraph>
        </div>
      </div>

      <div className="page-body">
        {isLoading && (
          <Row gutter={[20, 20]}>
            {[1, 2, 3, 4].map((i) => (
              <Col xs={24} sm={12} md={8} lg={6} key={i}>
                <Card style={{ border: '1px solid #E2E8F0' }}>
                  <Skeleton active />
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {!isLoading && !data?.data?.length && (
          <Empty
            description={<Text style={{ color: '#94A3B8' }}>目前無上架商品</Text>}
            style={{ padding: '80px 0' }}
          />
        )}

        <Row gutter={[20, 20]}>
          {data?.data?.map((product) => (
            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}
