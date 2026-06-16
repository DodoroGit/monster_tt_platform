import { Row, Col, Card, Typography, Space } from 'antd'
import { PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function ContactPage() {
  return (
    <div className="page-body">
      <div className="section-header" style={{ marginBottom: 40 }}>
        <Title className="section-heading">
          <PhoneOutlined style={{ marginRight: 10, color: '#059669' }} />
          聯絡我們
        </Title>
      </div>

      <Row gutter={20}>
        <Col xs={24} md={12}>
          <Card
            style={{
              border: '1px solid #E2E8F0',
              background: 'linear-gradient(135deg, #F8FAFC, #F0FDF4)',
            }}
            bodyStyle={{ padding: 32 }}
          >
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: '#ECFDF5',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <EnvironmentOutlined style={{ color: '#059669', fontSize: 18 }} />
                </div>
                <div>
                  <Text style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 2 }}>
                    地址
                  </Text>
                  <Text strong style={{ color: '#1E293B', fontSize: 15 }}>
                    桃園市桃園區正光路178號2樓
                  </Text>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: '#ECFDF5',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PhoneOutlined style={{ color: '#059669', fontSize: 18 }} />
                </div>
                <div>
                  <Text style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 2 }}>
                    電話
                  </Text>
                  <Text strong style={{ color: '#1E293B', fontSize: 15 }}>
                    0919-012-851
                  </Text>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
