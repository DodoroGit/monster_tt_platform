import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Tag, Typography, message, Empty, Avatar, Skeleton, Space, Modal, Form, Input } from 'antd'
import {
  UserOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  LockFilled,
  TrophyOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useState } from 'react'
import { coachesApi } from '@/api/coaches'
import { bookingApi } from '@/api/booking'
import { trialBookingApi } from '@/api/trialBooking'
import { useAuth } from '@/store/auth'
import type { CoachAvailability } from '@/types'

const { Title, Text, Paragraph } = Typography

interface HourSlot {
  start: dayjs.Dayjs
  end: dayjs.Dayjs
  isBooked: boolean
  availabilityId: string
  isRemainder?: boolean  // 30-min slot left over after a trial booking
}

interface TrialSlot {
  start: dayjs.Dayjs
  end: dayjs.Dayjs
  availabilityId: string
  coachId: string
  isBooked: boolean
}

function overlapsWithTrials(avail: CoachAvailability, start: dayjs.Dayjs, end: dayjs.Dayjs): boolean {
  return (avail.trial_bookings ?? []).some((tb) => {
    const ts = dayjs(tb.booking_start)
    const te = dayjs(tb.booking_end)
    return ts.isBefore(end) && te.isAfter(start)
  })
}

function generateHourSlots(avail: CoachAvailability): HourSlot[] {
  const slots: HourSlot[] = []
  let current = dayjs(avail.start_time)
  const end = dayjs(avail.end_time)
  while (!current.add(1, 'hour').isAfter(end)) {
    const slotEnd = current.add(1, 'hour')
    const bookedByRegular = (avail.bookings ?? []).some((b) => {
      if (b.status === 'cancelled') return false
      return dayjs(b.booking_start).isBefore(slotEnd) && dayjs(b.booking_end).isAfter(current)
    })
    const bookedByTrial = overlapsWithTrials(avail, current, slotEnd)
    slots.push({ start: current, end: slotEnd, isBooked: bookedByRegular || bookedByTrial, availabilityId: avail.id })
    current = slotEnd
  }
  return slots
}

function generateRemainderSlots(avail: CoachAvailability): HourSlot[] {
  if (avail.status === 'cancelled') return []
  const slots: HourSlot[] = []
  let current = dayjs(avail.start_time)
  const end = dayjs(avail.end_time)

  while (!current.add(1, 'hour').isAfter(end)) {
    const slotEnd = current.add(1, 'hour')
    const midPoint = current.add(30, 'minute')

    const hasRegularOverlap = (avail.bookings ?? []).some((b) => {
      if (b.status === 'cancelled') return false
      return dayjs(b.booking_start).isBefore(slotEnd) && dayjs(b.booking_end).isAfter(current)
    })

    if (!hasRegularOverlap) {
      const trialsInWindow = (avail.trial_bookings ?? []).filter((tb) => {
        if (tb.status === 'rejected') return false
        const ts = dayjs(tb.booking_start)
        const te = dayjs(tb.booking_end)
        return ts.isBefore(slotEnd) && te.isAfter(current)
      })

      if (trialsInWindow.length > 0) {
        const firstHalfBlocked = trialsInWindow.some((tb) => {
          const ts = dayjs(tb.booking_start)
          const te = dayjs(tb.booking_end)
          return ts.isBefore(midPoint) && te.isAfter(current)
        })
        const secondHalfBlocked = trialsInWindow.some((tb) => {
          const ts = dayjs(tb.booking_start)
          const te = dayjs(tb.booking_end)
          return ts.isBefore(slotEnd) && te.isAfter(midPoint)
        })

        if (!firstHalfBlocked && secondHalfBlocked) {
          slots.push({ start: current, end: midPoint, isBooked: false, availabilityId: avail.id, isRemainder: true })
        } else if (firstHalfBlocked && !secondHalfBlocked) {
          slots.push({ start: midPoint, end: slotEnd, isBooked: false, availabilityId: avail.id, isRemainder: true })
        }
      }
    }

    current = slotEnd
  }
  return slots
}

function generateTrialSlots(avail: CoachAvailability): TrialSlot[] {
  if (avail.status !== 'available') return []
  const slots: TrialSlot[] = []
  let current = dayjs(avail.start_time)
  const end = dayjs(avail.end_time)
  while (!current.add(30, 'minute').isAfter(end)) {
    const slotEnd = current.add(30, 'minute')
    const bookedByRegular = (avail.bookings ?? []).some((b) => {
      if (b.status === 'cancelled') return false
      return dayjs(b.booking_start).isBefore(slotEnd) && dayjs(b.booking_end).isAfter(current)
    })
    const bookedByTrial = overlapsWithTrials(avail, current, slotEnd)
    slots.push({
      start: current, end: slotEnd,
      availabilityId: avail.id, coachId: avail.coach_id,
      isBooked: bookedByRegular || bookedByTrial,
    })
    current = slotEnd
  }
  return slots
}

export default function CoachDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [trialModal, setTrialModal] = useState(false)
  const [selectedTrialSlot, setSelectedTrialSlot] = useState<TrialSlot | null>(null)
  const [trialForm] = Form.useForm()

  const { data: coachRes, isLoading: coachLoading } = useQuery({
    queryKey: ['coach', id],
    queryFn: () => coachesApi.getById(id!),
    enabled: !!id,
  })

  const { data: availRes, isLoading: availLoading } = useQuery({
    queryKey: ['availabilities', id],
    queryFn: () => coachesApi.getAvailabilities(id!),
    enabled: !!id,
  })

  const bookMutation = useMutation({
    mutationFn: (slot: HourSlot) =>
      bookingApi.create({
        availability_id: slot.availabilityId,
        booking_start: slot.start.toISOString(),
        booking_end: slot.end.toISOString(),
      }),
    onSuccess: () => {
      message.success('預約成功！')
      queryClient.invalidateQueries({ queryKey: ['availabilities', id] })
    },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '申請失敗'),
  })

  const trialMutation = useMutation({
    mutationFn: (values: { guest_name: string; guest_phone: string; password: string }) =>
      trialBookingApi.create({
        availability_id: selectedTrialSlot!.availabilityId,
        booking_start: selectedTrialSlot!.start.toISOString(),
        guest_name: values.guest_name,
        guest_phone: values.guest_phone,
        password: values.password,
      }),
    onSuccess: () => {
      message.success('試教申請已送出，等待店長審核！')
      setTrialModal(false)
      trialForm.resetFields()
      setSelectedTrialSlot(null)
    },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '申請失敗'),
  })

  const coach = coachRes?.data
  const availabilities = availRes?.data ?? []

  const now = dayjs()

  // Flatten all hour slots + remainder slots across all availability blocks
  const allSlots = [
    ...availabilities.flatMap(generateHourSlots),
    ...availabilities.flatMap(generateRemainderSlots),
  ]
    .filter((s) => s.start.isAfter(now))
    .sort((a, b) => a.start.valueOf() - b.start.valueOf())

  // Group by date
  const slotsByDate = allSlots.reduce<Record<string, HourSlot[]>>((acc, slot) => {
    const key = slot.start.format('YYYY-MM-DD')
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})

  // 30-min trial slots (from available blocks only, future only)
  const allTrialSlots = availabilities.flatMap(generateTrialSlots).filter((s) => s.start.isAfter(now))
  const trialSlotsByDate = allTrialSlots.reduce<Record<string, TrialSlot[]>>((acc, slot) => {
    const key = slot.start.format('YYYY-MM-DD')
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})

  const canBook = user && (user.role === 'customer' || user.role === 'owner')

  return (
    <div>
      {/* Header banner */}
      <div
        style={{
          background: 'linear-gradient(140deg, #0F172A 0%, #1E3A5F 100%)',
          padding: '40px 32px',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/booking')}
            style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 20, paddingLeft: 0 }}
          >
            返回教練列表
          </Button>

          {coachLoading ? (
            <Skeleton active avatar={{ size: 80 }} paragraph={{ rows: 2 }} />
          ) : coach ? (
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              {coach.avatar_url ? (
                <Avatar
                  src={coach.avatar_url}
                  size={108}
                  style={{
                    flexShrink: 0,
                    border: '3px solid rgba(16,185,129,0.4)',
                    boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
                  }}
                />
              ) : (
                <Avatar
                  icon={<UserOutlined />}
                  size={108}
                  style={{
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #059669, #10B981)',
                    border: '3px solid rgba(16,185,129,0.4)',
                    boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
                  }}
                />
              )}
              <div>
                <Title
                  level={2}
                  style={{ color: 'white', margin: '0 0 10px', fontWeight: 800, fontSize: 28 }}
                >
                  {coach.user?.name}
                </Title>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {coach.specialty && <Tag color="green">{coach.specialty}</Tag>}
                  {coach.years_exp > 0 && (
                    <Tag color="blue">{coach.years_exp} 年教學經驗</Tag>
                  )}
                </div>
                {coach.bio && (
                  <Paragraph style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 12px', fontSize: 14 }}>
                    {coach.bio}
                  </Paragraph>
                )}
                {coach.titles?.length > 0 && (
                  <Space size={6} wrap>
                    {coach.titles.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: 'rgba(253,230,138,0.15)',
                          border: '1px solid rgba(253,230,138,0.35)',
                          borderRadius: 20,
                          padding: '3px 10px',
                          fontSize: 12,
                          color: '#FDE68A',
                        }}
                      >
                        <TrophyOutlined style={{ fontSize: 11 }} />
                        {t.title}
                      </div>
                    ))}
                  </Space>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Slots section */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: '#ECFDF5',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarOutlined style={{ color: '#059669', fontSize: 18 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>
              選擇上課時段
            </Title>
            <Text style={{ fontSize: 13, color: '#64748B' }}>
              每次預約 1 小時・點擊綠色格子即可預約
            </Text>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { color: '#ECFDF5', border: '#059669', icon: <CheckCircleFilled style={{ color: '#059669', fontSize: 12 }} />, label: '可預約（1 小時）' },
            { color: '#F0F9FF', border: '#0EA5E9', icon: <CheckCircleFilled style={{ color: '#0EA5E9', fontSize: 12 }} />, label: '剩餘 30 分鐘' },
            { color: '#F1F5F9', border: '#CBD5E1', icon: <LockFilled style={{ color: '#94A3B8', fontSize: 12 }} />, label: '已被預約' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 24, height: 24, background: item.color, border: `1.5px solid ${item.border}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </div>
              <Text style={{ fontSize: 13, color: '#64748B' }}>{item.label}</Text>
            </div>
          ))}
        </div>

        {/* 預約說明 */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 24,
          }}
        >
          <InfoCircleOutlined style={{ color: '#3B82F6', fontSize: 16, flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.7 }}>
            <div>點選時段後預約即刻成立，無需等待教練確認。</div>
            <div>若需取消，請至個人頁面的「我的預約」提出取消申請，並聯繫小怪獸老闆協助處理。</div>
          </div>
        </div>

        {availLoading && (
          <div>
            {[1, 2].map((i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px', marginBottom: 12 }}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ))}
          </div>
        )}

        {!availLoading && allSlots.length === 0 && (
          <Empty description={<Text style={{ color: '#94A3B8' }}>目前無可預約時段</Text>} style={{ padding: '60px 0' }} />
        )}

        {Object.entries(slotsByDate).map(([date, slots]) => (
          <div
            key={date}
            style={{
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: '20px 24px',
              marginBottom: 14,
            }}
          >
            {/* Date header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
              <Text strong style={{ fontSize: 15, color: '#0F172A' }}>
                {dayjs(date).format('YYYY 年 MM 月 DD 日')}
                <span style={{ color: '#64748B', fontWeight: 400, marginLeft: 8, fontSize: 13 }}>
                  {dayjs(date).format('dddd')}
                </span>
              </Text>
              <Text style={{ fontSize: 13, color: '#94A3B8', marginLeft: 4 }}>
                {slots.filter((s) => !s.isBooked).length} 個時段可預約
              </Text>
            </div>

            {/* Hour grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {slots.map((slot) => {
                const available = !slot.isBooked
                return (
                  <button
                    key={slot.start.toISOString()}
                    disabled={!available || !canBook || bookMutation.isPending}
                    onClick={() => {
                      if (!available || !canBook) return
                      const label = slot.isRemainder ? '30 分鐘（剩餘時段）' : '1 小時'
                      const confirmed = window.confirm(
                        `確認預約此時段？\n${slot.start.format('YYYY/MM/DD HH:mm')} – ${slot.end.format('HH:mm')}（${label}）`
                      )
                      if (confirmed) bookMutation.mutate(slot)
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 90,
                      height: 64,
                      borderRadius: 10,
                      border: `1.5px solid ${available ? (slot.isRemainder ? '#0EA5E9' : '#059669') : '#CBD5E1'}`,
                      background: available ? (slot.isRemainder ? '#F0F9FF' : '#ECFDF5') : '#F8FAFC',
                      cursor: available && canBook ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                      opacity: !available ? 0.6 : 1,
                      outline: 'none',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (available && canBook) {
                        ;(e.currentTarget as HTMLElement).style.background = slot.isRemainder ? '#E0F2FE' : '#D1FAE5'
                        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = slot.isRemainder
                          ? '0 4px 12px rgba(14,165,233,0.2)'
                          : '0 4px 12px rgba(5,150,105,0.2)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = available ? (slot.isRemainder ? '#F0F9FF' : '#ECFDF5') : '#F8FAFC'
                      ;(e.currentTarget as HTMLElement).style.transform = ''
                      ;(e.currentTarget as HTMLElement).style.boxShadow = ''
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                      {available
                        ? <CheckCircleFilled style={{ color: slot.isRemainder ? '#0EA5E9' : '#059669', fontSize: 11 }} />
                        : <LockFilled style={{ color: '#94A3B8', fontSize: 11 }} />
                      }
                      <span style={{ fontSize: 11, color: available ? (slot.isRemainder ? '#0EA5E9' : '#059669') : '#94A3B8', fontWeight: 600 }}>
                        {available ? (slot.isRemainder ? '30min' : '可預約') : '已預約'}
                      </span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: available ? '#0F172A' : '#94A3B8', lineHeight: 1 }}>
                      {slot.start.format('HH:mm')}
                    </span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      –{slot.end.format('HH:mm')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {!canBook && !availLoading && allSlots.length > 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Button onClick={() => navigate('/login')} style={{ borderRadius: 8 }}>
              登入以申請預約
            </Button>
          </div>
        )}

        {/* 試教申請區塊（僅未登入訪客可見） */}
        {!availLoading && (!user || user.role === 'owner') && allTrialSlots.length > 0 && (
          <div style={{ marginTop: 40 }}>
            {/* 標題 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, background: '#FFF7ED', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ExperimentOutlined style={{ color: '#EA580C', fontSize: 18 }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>
                  申請試教
                </Title>
                <Text style={{ fontSize: 13, color: '#64748B' }}>
                  30 分鐘體驗課・無需登入・需輸入試教密碼・由店長審核後成立
                </Text>
              </div>
            </div>

            {/* 說明 */}
            <div style={{
              display: 'flex', gap: 12, background: '#FFF7ED', border: '1px solid #FED7AA',
              borderRadius: 12, padding: '14px 18px', marginBottom: 20,
            }}>
              <InfoCircleOutlined style={{ color: '#EA580C', fontSize: 16, flexShrink: 0, marginTop: 2 }} />
              <Text style={{ fontSize: 13, color: '#9A3412', lineHeight: 1.7 }}>
                試教申請送出後需等待店長審核確認，並非即時成立。試教密碼請向小怪獸老闆索取。
              </Text>
            </div>

            {/* 30-min 時段 */}
            {Object.entries(trialSlotsByDate).map(([date, slots]) => (
              <div key={date} style={{
                background: 'white', border: '1px solid #FED7AA',
                borderRadius: 14, padding: '20px 24px', marginBottom: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EA580C' }} />
                  <Text strong style={{ fontSize: 15, color: '#0F172A' }}>
                    {dayjs(date).format('YYYY 年 MM 月 DD 日')}
                    <span style={{ color: '#64748B', fontWeight: 400, marginLeft: 8, fontSize: 13 }}>
                      {dayjs(date).format('dddd')}
                    </span>
                  </Text>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {slots.map((slot) => {
                    const free = !slot.isBooked
                    return (
                      <button
                        key={slot.start.toISOString()}
                        disabled={!free}
                        onClick={() => { if (free) { setSelectedTrialSlot(slot); setTrialModal(true) } }}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          justifyContent: 'center', width: 90, height: 64, borderRadius: 10,
                          border: `1.5px solid ${free ? '#EA580C' : '#CBD5E1'}`,
                          background: free ? '#FFF7ED' : '#F8FAFC',
                          cursor: free ? 'pointer' : 'default',
                          outline: 'none', padding: 0, opacity: free ? 1 : 0.6,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (free) {
                            (e.currentTarget as HTMLElement).style.background = '#FFEDD5'
                            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(234,88,12,0.2)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = free ? '#FFF7ED' : '#F8FAFC'
                          ;(e.currentTarget as HTMLElement).style.transform = ''
                          ;(e.currentTarget as HTMLElement).style.boxShadow = ''
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                          {free
                            ? <CheckCircleFilled style={{ color: '#EA580C', fontSize: 10 }} />
                            : <LockFilled style={{ color: '#94A3B8', fontSize: 10 }} />
                          }
                          <span style={{ fontSize: 10, color: free ? '#EA580C' : '#94A3B8', fontWeight: 600 }}>
                            {free ? '試教 30min' : '已佔用'}
                          </span>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: free ? '#0F172A' : '#94A3B8', lineHeight: 1 }}>
                          {slot.start.format('HH:mm')}
                        </span>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>–{slot.end.format('HH:mm')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 試教申請 Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExperimentOutlined style={{ color: '#EA580C' }} />
            <span>申請試教</span>
          </div>
        }
        open={trialModal}
        onCancel={() => { setTrialModal(false); trialForm.resetFields() }}
        onOk={() => trialForm.submit()}
        confirmLoading={trialMutation.isPending}
        okText="送出申請"
        cancelText="取消"
      >
        {selectedTrialSlot && (
          <div style={{
            background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#9A3412',
          }}>
            預約時段：{selectedTrialSlot.start.format('YYYY/MM/DD HH:mm')} – {selectedTrialSlot.end.format('HH:mm')}（30 分鐘）
          </div>
        )}
        <Form form={trialForm} layout="vertical" onFinish={(v) => trialMutation.mutate(v)}>
          <Form.Item label="姓名" name="guest_name" rules={[{ required: true, message: '請輸入姓名' }]}>
            <Input placeholder="請輸入您的姓名" />
          </Form.Item>
          <Form.Item label="手機號碼" name="guest_phone" rules={[{ required: true, message: '請輸入手機號碼' }]}>
            <Input placeholder="請輸入您的手機號碼" />
          </Form.Item>
          <Form.Item label="試教密碼" name="password" rules={[{ required: true, message: '請輸入試教密碼' }]}>
            <Input.Password placeholder="請向小怪獸老闆索取密碼" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
