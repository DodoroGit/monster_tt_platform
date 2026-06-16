import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Typography, Tag, Button, InputNumber, Image, Row, Col, message, Skeleton } from 'antd'
import {
  ShoppingCartOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons'
import { useState } from 'react'
import { productsApi } from '@/api/products'
import { cartStore } from '@/store/cart'

const { Title, Paragraph, Text } = Typography

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id!),
    enabled: !!id,
  })

  const product = data?.data

  if (isLoading) {
    return (
      <div className="page-body" style={{ maxWidth: 1000 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    )
  }
  if (!product) {
    return (
      <div className="page-body">
        <Text style={{ color: '#94A3B8' }}>商品不存在</Text>
      </div>
    )
  }

  const inStock = product.stock > 0

  return (
    <div>
      <div
        style={{
          background: 'linear-gradient(140deg, #0F172A 0%, #1E3A5F 100%)',
          padding: '32px 32px 28px',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/shop')}
            style={{ color: 'rgba(255,255,255,0.6)', paddingLeft: 0 }}
          >
            返回商城
          </Button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 32px' }}>
        <Row gutter={[40, 32]}>
          {/* Images */}
          <Col xs={24} md={12}>
            {product.images?.length ? (
              <Image.PreviewGroup>
                <div
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: '1px solid #E2E8F0',
                    marginBottom: 12,
                    background: 'white',
                  }}
                >
                  <Image
                    src={product.images[0].image_url}
                    style={{ width: '100%', display: 'block' }}
                    preview={{ mask: '查看大圖' }}
                  />
                </div>
                {product.images.length > 1 && (
                  <Row gutter={8}>
                    {product.images.slice(1).map((img) => (
                      <Col key={img.id} span={6}>
                        <div
                          style={{
                            borderRadius: 10,
                            overflow: 'hidden',
                            border: '1px solid #E2E8F0',
                            background: 'white',
                          }}
                        >
                          <Image
                            src={img.image_url}
                            style={{ width: '100%', display: 'block' }}
                            preview={{ mask: '' }}
                          />
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </Image.PreviewGroup>
            ) : (
              <div
                style={{
                  height: 340,
                  background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 80,
                  borderRadius: 16,
                  border: '1px solid #E2E8F0',
                }}
              >
                🏓
              </div>
            )}
          </Col>

          {/* Info */}
          <Col xs={24} md={12}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 16,
              }}
            >
              {inStock ? (
                <>
                  <CheckCircleFilled style={{ color: '#10B981' }} />
                  <Text style={{ color: '#10B981', fontSize: 14, fontWeight: 600 }}>
                    有貨 · 庫存 {product.stock} 件
                  </Text>
                </>
              ) : (
                <>
                  <CloseCircleFilled style={{ color: '#EF4444' }} />
                  <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: 600 }}>缺貨</Text>
                </>
              )}
            </div>

            <Title
              level={2}
              style={{
                fontWeight: 900,
                color: '#0F172A',
                marginBottom: 16,
                letterSpacing: '-0.5px',
                lineHeight: 1.2,
              }}
            >
              {product.name}
            </Title>

            <div
              style={{
                background: 'linear-gradient(135deg, #ECFDF5, #F0FDF4)',
                border: '1px solid #A7F3D0',
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 24,
                display: 'inline-block',
              }}
            >
              <Text
                strong
                style={{ fontSize: 32, color: '#059669', letterSpacing: '-1px', lineHeight: 1 }}
              >
                NT$ {Number(product.price).toLocaleString()}
              </Text>
            </div>

            {product.description && (
              <Paragraph
                style={{
                  color: '#475569',
                  fontSize: 15,
                  lineHeight: 1.8,
                  marginBottom: 28,
                }}
              >
                {product.description}
              </Paragraph>
            )}

            <div
              style={{
                borderTop: '1px solid #E2E8F0',
                paddingTop: 24,
              }}
            >
              <Text
                style={{ fontSize: 13, color: '#64748B', display: 'block', marginBottom: 12, fontWeight: 500 }}
              >
                購買數量
              </Text>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <InputNumber
                  min={1}
                  max={product.stock}
                  value={qty}
                  onChange={(v) => setQty(v ?? 1)}
                  disabled={!inStock}
                  style={{ width: 90, borderRadius: 8 }}
                  size="large"
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  disabled={!inStock}
                  onClick={() => {
                    cartStore.addItem(product, qty)
                    message.success('已加入購物車')
                  }}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 16,
                    boxShadow: inStock ? '0 4px 16px rgba(5,150,105,0.35)' : undefined,
                  }}
                >
                  加入購物車
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  )
}
