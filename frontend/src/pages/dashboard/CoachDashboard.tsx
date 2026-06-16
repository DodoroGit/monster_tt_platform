import { Tabs, Table, Tag, Button, Form, DatePicker, TimePicker, Input, InputNumber, message, Modal, Popconfirm, Space, Upload, Avatar, Card, Statistic, Divider, Empty } from 'antd'
import { UploadOutlined, UserOutlined, PlusOutlined, DeleteOutlined, TrophyOutlined, ExperimentOutlined, DollarOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingApi } from '@/api/booking'
import { coachesApi } from '@/api/coaches'
import { trialBookingApi } from '@/api/trialBooking'
import { useAuth } from '@/store/auth'
import dayjs from 'dayjs'
import type { Booking, CoachAvailability, TrialBooking } from '@/types'
import { useState } from 'react'


const statusColors: Record<string, string> = { pending: 'orange', confirmed: 'green', cancel_requested: 'volcano', cancelled: 'red', completed: 'blue' }

export default function CoachDashboard() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileForm] = Form.useForm()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [salaryRange, setSalaryRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [salaryRate, setSalaryRate] = useState<number | null>(null)
  const [salaryResult, setSalaryResult] = useState<{ sessions: Booking[]; totalMinutes: number; total: number } | null>(null)

  const { data: bookingsRes } = useQuery({ queryKey: ['coach-bookings'], queryFn: bookingApi.listMine })
  const { data: availRes } = useQuery({ queryKey: ['my-avail'], queryFn: bookingApi.listMyAvailabilities })

  const createAvailMutation = useMutation({
    mutationFn: (data: { start_time: string; end_time: string }) => bookingApi.createAvailability(data),
    onSuccess: () => { message.success('時段新增成功'); qc.invalidateQueries({ queryKey: ['my-avail'] }) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '失敗'),
  })

  const deleteAvailMutation = useMutation({
    mutationFn: bookingApi.deleteAvailability,
    onSuccess: () => { message.success('時段已刪除'); qc.invalidateQueries({ queryKey: ['my-avail'] }) },
  })

  const updateProfileMutation = useMutation({
    mutationFn: coachesApi.updateMyProfile,
    onSuccess: () => { message.success('個人資料已更新'); setProfileOpen(false) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '失敗'),
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: coachesApi.uploadAvatar,
    onSuccess: () => { message.success('大頭照已更新'); qc.invalidateQueries({ queryKey: ['coaches'] }) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '上傳失敗'),
  })

  const { data: myProfileRes } = useQuery({
    queryKey: ['my-profile'],
    queryFn: coachesApi.list,
    select: (res) => res.data?.find((p) => p.user_id === user?.id),
  })

  const invalidateTitles = () => {
    qc.invalidateQueries({ queryKey: ['my-profile'] })
    qc.invalidateQueries({ queryKey: ['coaches'] })
  }

  const addTitleMutation = useMutation({
    mutationFn: coachesApi.addTitle,
    onSuccess: () => { message.success('頭銜已新增'); setNewTitle(''); invalidateTitles() },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '新增失敗'),
  })

  const updateTitleMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => coachesApi.updateTitle(id, title),
    onSuccess: () => { message.success('頭銜已更新'); setEditingId(null); invalidateTitles() },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '更新失敗'),
  })

  const deleteTitleMutation = useMutation({
    mutationFn: coachesApi.deleteTitle,
    onSuccess: () => { message.success('頭銜已刪除'); invalidateTitles() },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '刪除失敗'),
  })

  const reorderMutation = useMutation({
    mutationFn: coachesApi.reorderTitles,
    onSuccess: () => invalidateTitles(),
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '排序更新失敗'),
  })

  const { data: myTrialsRes } = useQuery({ queryKey: ['my-trials'], queryFn: trialBookingApi.listMine })

  const cancelMutation = useMutation({
    mutationFn: bookingApi.cancel,
    onSuccess: () => { message.success('已送出取消申請，等待店長確認'); qc.invalidateQueries({ queryKey: ['coach-bookings'] }) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '申請失敗'),
  })

  const cancelTrialMutation = useMutation({
    mutationFn: trialBookingApi.cancel,
    onSuccess: () => { message.success('已送出取消申請，等待店長確認'); qc.invalidateQueries({ queryKey: ['my-trials'] }) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '申請失敗'),
  })

  const statusLabel: Record<string, string> = {
    pending: '待確認', confirmed: '已確認', cancel_requested: '申請取消中', cancelled: '已取消', completed: '已完成',
  }

  const trialStatusLabel: Record<string, string> = {
    pending: '待審核', approved: '已核准', rejected: '已拒絕', cancel_requested: '申請取消中', cancelled: '已取消',
  }
  const trialStatusColor: Record<string, string> = {
    pending: 'orange', approved: 'green', rejected: 'red', cancel_requested: 'volcano', cancelled: 'red',
  }

  const bookingCols = [
    { title: '顧客', key: 'customer', render: (_: unknown, r: Booking) => r.customer?.name ?? '-' },
    { title: '手機', key: 'phone', render: (_: unknown, r: Booking) => r.customer?.phone ?? '-' },
    {
      title: '時段', key: 'time',
      render: (_: unknown, r: Booking) =>
        r.availability
          ? `${dayjs(r.booking_start).format('MM/DD HH:mm')} – ${dayjs(r.booking_end).format('HH:mm')}`
          : '-',
    },
    { title: '備註', dataIndex: 'note', key: 'note' },
    {
      title: '狀態', key: 'status',
      render: (_: unknown, r: Booking) => (
        <Tag color={statusColors[r.status]}>{statusLabel[r.status] ?? r.status}</Tag>
      ),
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, r: Booking) => {
        if (r.status !== 'confirmed') return null
        return (
          <Popconfirm
            title="申請取消此預約？"
            description="送出後需等待店長審核才會正式取消。"
            okText="送出申請"
            okButtonProps={{ danger: true }}
            cancelText="返回"
            onConfirm={() => cancelMutation.mutate(r.id)}
          >
            <Button danger size="small" loading={cancelMutation.isPending}>申請取消</Button>
          </Popconfirm>
        )
      },
    },
  ]

  const trialCols = [
    { title: '申請人', dataIndex: 'guest_name', key: 'guest_name' },
    { title: '手機', dataIndex: 'guest_phone', key: 'guest_phone' },
    {
      title: '時段', key: 'time',
      render: (_: unknown, r: TrialBooking) =>
        `${dayjs(r.booking_start).format('MM/DD HH:mm')} – ${dayjs(r.booking_end).format('HH:mm')} (30 分鐘)`,
    },
    {
      title: '狀態', key: 'status',
      render: (_: unknown, r: TrialBooking) => (
        <Tag color={trialStatusColor[r.status]}>{trialStatusLabel[r.status] ?? r.status}</Tag>
      ),
    },
    { title: '申請時間', key: 'created', render: (_: unknown, r: TrialBooking) => dayjs(r.created_at).format('MM/DD HH:mm') },
    {
      title: '操作', key: 'action',
      render: (_: unknown, r: TrialBooking) => {
        if (r.status !== 'approved') return null
        return (
          <Popconfirm
            title="申請取消此試教？"
            description="送出後需等待店長審核才會正式取消。"
            okText="送出申請"
            okButtonProps={{ danger: true }}
            cancelText="返回"
            onConfirm={() => cancelTrialMutation.mutate(r.id)}
          >
            <Button danger size="small" loading={cancelTrialMutation.isPending}>申請取消</Button>
          </Popconfirm>
        )
      },
    },
  ]

  const availCols = [
    { title: '開始時間', key: 'start', render: (_: unknown, r: CoachAvailability) => dayjs(r.start_time).format('YYYY/MM/DD HH:mm') },
    { title: '結束時間', key: 'end', render: (_: unknown, r: CoachAvailability) => dayjs(r.end_time).format('HH:mm') },
    { title: '狀態', key: 'status', render: (_: unknown, r: CoachAvailability) => <Tag color={r.status === 'available' ? 'green' : r.status === 'booked' ? 'red' : 'default'}>{r.status}</Tag> },
    { title: '操作', key: 'del', render: (_: unknown, r: CoachAvailability) => r.status === 'available' ? <Button danger size="small" onClick={() => deleteAvailMutation.mutate(r.id)}>刪除</Button> : null },
  ]

  const tabItems = [
    {
      key: 'bookings', label: '預約申請',
      children: (
        <div>
          <div style={{ fontWeight: 600, color: '#1D4ED8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserOutlined /> 一般預約
          </div>
          <Table dataSource={bookingsRes?.data} columns={bookingCols} rowKey="id" size="small" locale={{ emptyText: '目前無預約記錄' }} />

          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 600, color: '#9A3412', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ExperimentOutlined /> 試教申請
            </div>
            <Table dataSource={myTrialsRes?.data} columns={trialCols} rowKey="id" size="small" locale={{ emptyText: '目前無試教申請' }} />
          </div>
        </div>
      ),
    },
    {
      key: 'avail', label: '我的時段',
      children: (
        <>
          <Form
            layout="inline"
            style={{ marginBottom: 16, gap: 8, flexWrap: 'wrap' }}
            onFinish={(v) => {
              const date = v.date.format('YYYY-MM-DD')
              const start = dayjs(`${date} ${v.startTime.format('HH:mm')}`)
              const end = dayjs(`${date} ${v.endTime.format('HH:mm')}`)
              if (!end.isAfter(start)) {
                message.error('結束時間必須晚於開始時間')
                return
              }
              createAvailMutation.mutate({ start_time: start.toISOString(), end_time: end.toISOString() })
            }}
          >
            <Form.Item name="date" rules={[{ required: true, message: '請選擇日期' }]}>
              <DatePicker
                placeholder="選擇日期"
                format="YYYY-MM-DD"
                disabledDate={(d) => d.isBefore(dayjs().startOf('day'))}
              />
            </Form.Item>
            <Form.Item name="startTime" rules={[{ required: true, message: '請選擇開始時間' }]}>
              <TimePicker placeholder="開始時間" format="HH:mm" minuteStep={30} />
            </Form.Item>
            <Form.Item name="endTime" rules={[{ required: true, message: '請選擇結束時間' }]}>
              <TimePicker placeholder="結束時間" format="HH:mm" minuteStep={30} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={createAvailMutation.isPending}>
                新增時段
              </Button>
            </Form.Item>
          </Form>
          <Table dataSource={availRes?.data} columns={availCols} rowKey="id" />
        </>
      ),
    },
    {
      key: 'salary', label: <span><DollarOutlined /> 我的薪資</span>,
      children: (() => {
        const calculate = () => {
          if (!salaryRange || !salaryRate) {
            message.warning('請填寫所有欄位')
            return
          }
          const [from, to] = salaryRange
          const sessions = (bookingsRes?.data ?? []).filter((b: Booking) => {
            if (b.status === 'cancelled') return false
            const start = dayjs(b.booking_start)
            return !start.isBefore(from.startOf('day')) && !start.isAfter(to.endOf('day'))
          })
          const totalMinutes = sessions.reduce((sum: number, b: Booking) =>
            sum + dayjs(b.booking_end).diff(dayjs(b.booking_start), 'minute'), 0)
          setSalaryResult({ sessions, totalMinutes, total: (totalMinutes / 60) * salaryRate })
        }

        return (
          <div style={{ maxWidth: 860 }}>
            <Card style={{ marginBottom: 24, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#64748B', marginBottom: 6 }}>計算區間</div>
                  <DatePicker.RangePicker
                    value={salaryRange}
                    onChange={(v) => { setSalaryRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null); setSalaryResult(null) }}
                    format="YYYY/MM/DD"
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#64748B', marginBottom: 6 }}>時薪（元）</div>
                  <InputNumber
                    min={0}
                    step={50}
                    placeholder="500"
                    value={salaryRate}
                    onChange={(v) => { setSalaryRate(v); setSalaryResult(null) }}
                    style={{ width: 130 }}
                    addonAfter="元/小時"
                  />
                </div>
                <Button type="primary" icon={<DollarOutlined />} onClick={calculate}>
                  計算薪資
                </Button>
              </div>
            </Card>

            {salaryResult && (
              <Card
                style={{ border: '1px solid #D1FAE5', background: '#F0FDF4' }}
                title={
                  <span style={{ color: '#065F46', fontWeight: 700 }}>
                    <DollarOutlined style={{ marginRight: 8 }} />
                    {salaryRange![0].format('YYYY/MM/DD')} ~ {salaryRange![1].format('YYYY/MM/DD')}
                  </span>
                }
              >
                <div style={{ display: 'flex', gap: 40, marginBottom: 20 }}>
                  <Statistic
                    title="課堂數"
                    value={salaryResult.sessions.length}
                    suffix="堂"
                    valueStyle={{ color: '#059669', fontWeight: 700 }}
                  />
                  <Statistic
                    title="總時數"
                    value={Math.floor(salaryResult.totalMinutes / 60)}
                    suffix={`小時 ${salaryResult.totalMinutes % 60 > 0 ? `${salaryResult.totalMinutes % 60} 分` : ''}`}
                    valueStyle={{ color: '#059669', fontWeight: 700 }}
                  />
                  <Statistic
                    title="應收薪資"
                    prefix="NT$"
                    value={salaryResult.total.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    valueStyle={{ color: '#DC2626', fontWeight: 800, fontSize: 28 }}
                  />
                </div>

                <Divider style={{ margin: '12px 0' }} />

                {salaryResult.sessions.length === 0 ? (
                  <Empty description="此區間無課堂記錄" />
                ) : (
                  <Table
                    dataSource={salaryResult.sessions}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: '日期', key: 'date',
                        render: (_: unknown, r: Booking) => dayjs(r.booking_start).format('YYYY/MM/DD'),
                      },
                      {
                        title: '時段', key: 'time',
                        render: (_: unknown, r: Booking) =>
                          `${dayjs(r.booking_start).format('HH:mm')} – ${dayjs(r.booking_end).format('HH:mm')}`,
                      },
                      {
                        title: '學員', key: 'customer',
                        render: (_: unknown, r: Booking) => r.customer?.name ?? '-',
                      },
                      {
                        title: '時數', key: 'hours',
                        render: (_: unknown, r: Booking) => {
                          const mins = dayjs(r.booking_end).diff(dayjs(r.booking_start), 'minute')
                          return mins >= 60
                            ? `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}`
                            : `${mins}m`
                        },
                      },
                      {
                        title: '小計', key: 'subtotal',
                        render: (_: unknown, r: Booking) => {
                          const hours = dayjs(r.booking_end).diff(dayjs(r.booking_start), 'minute') / 60
                          return `NT$ ${(hours * salaryRate!).toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                        },
                      },
                      {
                        title: '狀態', key: 'status',
                        render: (_: unknown, r: Booking) => (
                          <Tag color={r.status === 'completed' ? 'blue' : 'green'}>
                            {r.status === 'completed' ? '已完成' : '已確認'}
                          </Tag>
                        ),
                      },
                    ]}
                  />
                )}
              </Card>
            )}
          </div>
        )
      })(),
    },
  ]

  return (
    <>
      <Button style={{ marginBottom: 16 }} onClick={() => { profileForm.resetFields(); setProfileOpen(true) }}>
        編輯個人資料
      </Button>
      <Tabs items={tabItems} />
      <Modal
        title="編輯教練個人資料"
        open={profileOpen}
        onCancel={() => setProfileOpen(false)}
        onOk={() => profileForm.submit()}
        confirmLoading={updateProfileMutation.isPending}
      >
        {/* 頭像上傳（獨立於 form，直接呼叫 API）*/}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar
            size={96}
            src={avatarPreview ?? undefined}
            icon={!avatarPreview ? <UserOutlined /> : undefined}
            style={{ background: 'linear-gradient(135deg,#059669,#10B981)', marginBottom: 12, display: 'block', margin: '0 auto 12px' }}
          />
          <Upload
            accept="image/*"
            showUploadList={false}
            customRequest={({ file }) => {
              const f = file as File
              setAvatarPreview(URL.createObjectURL(f))
              uploadAvatarMutation.mutate(f)
            }}
          >
            <Button icon={<UploadOutlined />} size="small" loading={uploadAvatarMutation.isPending}>
              上傳大頭照
            </Button>
          </Upload>
        </div>

        <Form form={profileForm} layout="vertical" onFinish={(v) => updateProfileMutation.mutate(v)}>
          <Form.Item label="專長" name="specialty"><Input /></Form.Item>
          <Form.Item label="年資" name="years_exp"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item label="個人簡介" name="bio"><Input.TextArea rows={3} /></Form.Item>
        </Form>

        {/* 頭銜管理 */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrophyOutlined style={{ color: '#D97706' }} />
            <span style={{ fontWeight: 600, color: '#0F172A' }}>獎項 / 頭銜</span>
          </div>

          {/* 現有頭銜列表 */}
          <div style={{ marginBottom: 12 }}>
            {(myProfileRes?.titles ?? []).length === 0 && (
              <div style={{ color: '#94A3B8', fontSize: 13, padding: '8px 0' }}>尚未新增任何頭銜</div>
            )}
            {(myProfileRes?.titles ?? []).map((t, idx, arr) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  padding: '6px 10px',
                  marginBottom: 6,
                }}
              >
                {/* 上下移動 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                  <Button
                    type="text" size="small"
                    disabled={idx === 0 || reorderMutation.isPending}
                    style={{ padding: '0 4px', height: 18, lineHeight: 1, fontSize: 11, color: '#94A3B8' }}
                    onClick={() => {
                      const ids = arr.map((x) => x.id)
                      ;[ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]
                      reorderMutation.mutate(ids)
                    }}
                  >▲</Button>
                  <Button
                    type="text" size="small"
                    disabled={idx === arr.length - 1 || reorderMutation.isPending}
                    style={{ padding: '0 4px', height: 18, lineHeight: 1, fontSize: 11, color: '#94A3B8' }}
                    onClick={() => {
                      const ids = arr.map((x) => x.id)
                      ;[ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]]
                      reorderMutation.mutate(ids)
                    }}
                  >▼</Button>
                </div>

                <TrophyOutlined style={{ color: '#D97706', fontSize: 13, flexShrink: 0 }} />

                {/* 編輯中 or 顯示 */}
                {editingId === t.id ? (
                  <Input
                    autoFocus
                    size="small"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onPressEnter={() => { if (editText.trim()) updateTitleMutation.mutate({ id: t.id, title: editText.trim() }) }}
                    onBlur={() => { if (editText.trim() && editText !== t.title) updateTitleMutation.mutate({ id: t.id, title: editText.trim() }); else setEditingId(null) }}
                    style={{ flex: 1, borderRadius: 6 }}
                  />
                ) : (
                  <span
                    style={{ flex: 1, fontSize: 14, color: '#1E293B', cursor: 'text' }}
                    onDoubleClick={() => { setEditingId(t.id); setEditText(t.title) }}
                    title="雙擊編輯"
                  >
                    {t.title}
                  </span>
                )}

                {/* 編輯 / 刪除 */}
                <Space size={2} style={{ flexShrink: 0 }}>
                  {editingId !== t.id && (
                    <Button
                      type="text" size="small"
                      style={{ color: '#64748B', padding: '0 4px' }}
                      onClick={() => { setEditingId(t.id); setEditText(t.title) }}
                    >✏️</Button>
                  )}
                  <Button
                    type="text" danger size="small"
                    icon={<DeleteOutlined />}
                    loading={deleteTitleMutation.isPending}
                    style={{ padding: '0 4px' }}
                    onClick={() => deleteTitleMutation.mutate(t.id)}
                  />
                </Space>
              </div>
            ))}
          </div>

          {/* 新增頭銜 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="輸入頭銜，例如：大專盃個人單打冠軍"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onPressEnter={() => { if (newTitle.trim()) addTitleMutation.mutate(newTitle.trim()) }}
              style={{ borderRadius: 8 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={addTitleMutation.isPending}
              disabled={!newTitle.trim()}
              onClick={() => addTitleMutation.mutate(newTitle.trim())}
              style={{ borderRadius: 8, flexShrink: 0 }}
            >
              新增
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
