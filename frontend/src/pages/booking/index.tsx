import { Row, Col, Card, Typography, Tag, Button, Avatar, Skeleton } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { coachesApi } from '@/api/coaches'
import { useNavigate } from 'react-router-dom'
import { UserOutlined, CalendarOutlined, ArrowRightOutlined, TrophyOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

export default function BookingPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['coaches'],
    queryFn: coachesApi.list,
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
            <CalendarOutlined style={{ color: '#10B981', fontSize: 13 }} />
            <Text style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>教練預約系統</Text>
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
            選擇您的專屬教練
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, margin: 0 }}>
            瀏覽教練陣容，選擇適合您的時段立即預約
          </Paragraph>
        </div>
      </div>

      {/* Coach grid */}
      <div className="page-body">
        {isLoading && (
          <Row gutter={[20, 20]}>
            {[1, 2, 3].map((i) => (
              <Col xs={24} sm={12} md={8} key={i}>
                <Card style={{ border: '1px solid #E2E8F0' }}>
                  <Skeleton active avatar paragraph={{ rows: 3 }} />
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {!isLoading && !data?.data?.length && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 0',
              color: '#94A3B8',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏓</div>
            <Text style={{ fontSize: 16 }}>目前無教練資料</Text>
          </div>
        )}

        <Row gutter={[20, 20]}>
          {data?.data?.map((profile) => (
            <Col xs={24} sm={12} md={8} key={profile.id}>
              <Card
                className="hover-lift"
                style={{ border: '1px solid #E2E8F0' }}
                bodyStyle={{ padding: 28 }}
              >
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 20 }}>
                  {profile.avatar_url ? (
                    <Avatar
                      src={profile.avatar_url}
                      size={96}
                      style={{
                        flexShrink: 0,
                        border: '3px solid #ECFDF5',
                        boxShadow: '0 4px 12px rgba(5,150,105,0.2)',
                      }}
                    />
                  ) : (
                    <Avatar
                      icon={<UserOutlined />}
                      size={96}
                      style={{
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, #059669, #10B981)',
                        border: '3px solid #ECFDF5',
                        boxShadow: '0 4px 12px rgba(5,150,105,0.2)',
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Title
                      level={5}
                      style={{
                        marginBottom: 8,
                        fontWeight: 700,
                        color: '#0F172A',
                        fontSize: 17,
                      }}
                    >
                      {profile.user?.name || '教練'}
                    </Title>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {profile.specialty && (
                        <Tag color="green">{profile.specialty}</Tag>
                      )}
                      {profile.years_exp > 0 && (
                        <Tag color="blue">{profile.years_exp} 年經驗</Tag>
                      )}
                    </div>
                  </div>
                </div>

                {/* 頭銜列表 */}
                {profile.titles?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    {profile.titles.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: '#92400E',
                          background: 'linear-gradient(90deg,#FEF3C7,#FDE68A22)',
                          border: '1px solid #FDE68A',
                          borderRadius: 6,
                          padding: '3px 8px',
                          marginBottom: 4,
                        }}
                      >
                        <TrophyOutlined style={{ fontSize: 11, color: '#D97706', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                      </div>
                    ))}
                    {profile.titles.length > 3 && (
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>+{profile.titles.length - 3} 項榮譽</span>
                    )}
                  </div>
                )}

                <Paragraph
                  ellipsis={{ rows: 2 }}
                  style={{
                    color: '#64748B',
                    fontSize: 14,
                    lineHeight: 1.7,
                    marginBottom: 20,
                  }}
                >
                  {profile.bio || '專業桌球教練，歡迎預約課程指導。'}
                </Paragraph>

                <Button
                  type="primary"
                  block
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate(`/booking/${profile.id}`)}
                  style={{ borderRadius: 8, height: 42, fontWeight: 600 }}
                >
                  查看時段並預約
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}
