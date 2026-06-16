import { Row, Col, Card, Typography, Tag, Button, Space, Tooltip } from 'antd'
import {
  TrophyOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  StarFilled,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { coachesApi } from '@/api/coaches'
import { awardsApi } from '@/api/awards'
import { Link, useNavigate } from 'react-router-dom'

const { Title, Paragraph, Text } = Typography

const courses = [
  {
    title: '初學者課程',
    desc: '適合完全無基礎的學員，從握拍到基本技術全面入門。',
    tags: ['初級'],
    icon: '🎯',
    color: '#DBEAFE',
    iconBg: '#2563EB',
  },
  {
    title: '進階技術班',
    desc: '針對有基礎的學員，強化攻守策略與力量訓練。',
    tags: ['中級', '進階'],
    icon: '⚡',
    color: '#FEF3C7',
    iconBg: '#D97706',
  },
  {
    title: '成人培訓班',
    desc: '專為參賽選手設計的高強度系統訓練課程。',
    tags: ['成人', '競技'],
    icon: '🏆',
    color: '#FCE7F3',
    iconBg: '#DB2777',
  },
  {
    title: '選手培訓班',
    desc: '6–18 歲選手專屬課程，寓教於樂、全面發展。',
    tags: ['選手', '競技'],
    icon: '🌱',
    color: '#D1FAE5',
    iconBg: '#059669',
  },
]



export default function HomePage() {
  const navigate = useNavigate()
  const { data: coachesRes } = useQuery({
    queryKey: ['coaches'],
    queryFn: coachesApi.list,
  })

  const { data: awardsRes } = useQuery({
    queryKey: ['awards'],
    queryFn: awardsApi.list,
  })

  const awards = awardsRes?.data ?? []

  return (
    <div>
      {/* ── Hero ── */}
      <div className="hero-wrapper">
        <div className="hero-inner">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(5,150,105,0.15)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 100,
              padding: '6px 18px',
              marginBottom: 28,
            }}
          >
            <StarFilled style={{ color: '#10B981', fontSize: 12 }} />
            <Text style={{ color: '#10B981', fontSize: 13, fontWeight: 600, letterSpacing: 0.3 }}>
              桃園頂級桌球訓練中心
            </Text>
          </div>

          <Title
            style={{
              color: 'white',
              fontSize: 'clamp(2.4rem, 6vw, 4rem)',
              fontWeight: 900,
              lineHeight: 1.08,
              marginBottom: 24,
              letterSpacing: '-1.5px',
            }}
          >
            征服每一顆球
            <br />
            <span style={{ color: '#10B981' }}>小怪獸桌球</span>
          </Title>

          <Paragraph
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 18,
              maxWidth: 480,
              margin: '0 auto 44px',
              lineHeight: 1.7,
            }}
          >
            專業教練陣容・頂級訓練設施・全年齡課程・
            <br />
            讓每一次揮拍都充滿力量與樂趣。
          </Paragraph>

          <Space size={16} wrap style={{ justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/booking')}
              style={{
                height: 52,
                padding: '0 36px',
                fontSize: 16,
                borderRadius: 10,
                fontWeight: 700,
                boxShadow: '0 4px 24px rgba(5,150,105,0.45)',
              }}
            >
              立即預約教練
            </Button>
            <Button
              size="large"
              ghost
              onClick={() => navigate('/shop')}
              style={{
                height: 52,
                padding: '0 36px',
                fontSize: 16,
                borderRadius: 10,
                borderColor: 'rgba(255,255,255,0.25)',
                color: 'white',
                fontWeight: 600,
              }}
            >
              瀏覽球具商城
            </Button>
          </Space>
        </div>
      </div>

      {/* ── Courses ── */}
      <div className="page-body">
        <div className="section-header" style={{ marginBottom: 40 }}>
          <Title className="section-heading">
            <TeamOutlined style={{ marginRight: 10, color: '#059669' }} />
            課程介紹
          </Title>
          <Paragraph style={{ color: '#64748B', marginTop: 20, fontSize: 15 }}>
            適合各年齡、各程度的專業訓練方案
          </Paragraph>
        </div>

        <Row gutter={[20, 20]} style={{ marginBottom: 64 }}>
          {courses.map((c) => (
            <Col xs={24} sm={12} md={6} key={c.title}>
              <Card
                className="hover-lift"
                style={{ height: '100%', border: '1px solid #E2E8F0' }}
                bodyStyle={{ padding: 28 }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: c.color,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    marginBottom: 18,
                  }}
                >
                  {c.icon}
                </div>
                <Title level={5} style={{ marginBottom: 10, fontWeight: 700, color: '#0F172A' }}>
                  {c.title}
                </Title>
                <Paragraph style={{ color: '#64748B', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                  {c.desc}
                </Paragraph>
                <Space size={6} wrap>
                  {c.tags.map((t) => (
                    <Tag
                      key={t}
                      style={{
                        background: c.color,
                        color: c.iconBg,
                      }}
                    >
                      {t}
                    </Tag>
                  ))}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ── Coaches ── */}
        <div className="section-header" style={{ marginBottom: 40 }}>
          <Title className="section-heading">
            <TeamOutlined style={{ marginRight: 10, color: '#059669' }} />
            教練陣容
          </Title>
          <Paragraph style={{ color: '#64748B', marginTop: 20, fontSize: 15 }}>
            認證專業教練，豐富教學經驗
          </Paragraph>
        </div>

        <Row gutter={[20, 20]} style={{ marginBottom: 64 }}>
          {coachesRes?.data?.length ? (
            coachesRes.data.map((p) => (
              <Col xs={24} sm={12} md={6} key={p.id}>
                <Card
                  className="hover-lift"
                  style={{ border: '1px solid #E2E8F0', textAlign: 'center' }}
                  bodyStyle={{ padding: '32px 24px 24px' }}
                  cover={null}
                >
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={p.user?.name}
                      style={{
                        width: 128,
                        height: 128,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #ECFDF5',
                        boxShadow: '0 4px 12px rgba(5,150,105,0.2)',
                        marginBottom: 16,
                        display: 'block',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 128,
                        height: 128,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #059669, #10B981)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 36,
                        margin: '0 auto 16px',
                        boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                      }}
                    >
                      🏓
                    </div>
                  )}
                  <Title level={5} style={{ marginBottom: 8, fontWeight: 700, color: '#0F172A' }}>
                    {p.user?.name || '教練'}
                  </Title>
                  <Tag color="green" style={{ marginBottom: 12 }}>
                    {p.specialty || '桌球教練'}
                  </Tag>
                  {p.years_exp > 0 && (
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 10 }}>
                      {p.years_exp} 年教學經驗
                    </div>
                  )}
                  {/* 頭銜 */}
                  {p.titles?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      {p.titles.slice(0, 3).map((t) => (
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
                      {p.titles.length > 3 && (
                        <div style={{ fontSize: 11, color: '#94A3B8', paddingLeft: 4 }}>
                          +{p.titles.length - 3} 項榮譽
                        </div>
                      )}
                    </div>
                  )}
                  <Button
                    type="primary"
                    block
                    style={{ marginTop: 20, borderRadius: 8, fontWeight: 600 }}
                    onClick={() => navigate(`/booking/${p.id}`)}
                  >
                    預約課程
                  </Button>
                </Card>
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Paragraph style={{ color: '#94A3B8' }}>教練資料載入中…</Paragraph>
            </Col>
          )}
        </Row>

        {/* ── Awards ── */}
        <div className="section-header" style={{ marginBottom: 40 }}>
          <Title className="section-heading">
            <TrophyOutlined style={{ marginRight: 10, color: '#D97706' }} />
            獲獎榮耀
          </Title>
          <Paragraph style={{ color: '#64748B', marginTop: 20, fontSize: 15 }}>
            屢獲殊榮，實力有目共睹
          </Paragraph>
        </div>

        <div style={{ marginBottom: 64 }}>
          {awards.map((a, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '18px 24px',
                marginBottom: 10,
                transition: 'box-shadow 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.boxShadow =
                  '0 4px 12px rgba(0,0,0,0.08)')
              }
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TrophyOutlined style={{ color: '#D97706', fontSize: 20 }} />
              </div>
              <div style={{ flex: 1 }}>
                <Text strong style={{ color: '#0F172A', fontSize: 15 }}>
                  {a.title}
                </Text>
              </div>
              <Tag color="gold" style={{ flexShrink: 0 }}>
                {a.year}
              </Tag>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
