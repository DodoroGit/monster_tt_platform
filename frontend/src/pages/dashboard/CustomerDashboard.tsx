import { Tabs, Table, Tag, Button, message, Popconfirm, Form, Input, Select, DatePicker, Card, Row, Col, Space, Typography } from 'antd'
import {
  UserOutlined, PhoneOutlined, MailOutlined, CalendarOutlined,
  ManOutlined, CommentOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingApi } from '@/api/booking'
import { ordersApi } from '@/api/orders'
import { usersApi } from '@/api/users'
import { authApi } from '@/api/auth'
import dayjs from 'dayjs'
import type { Booking, Order } from '@/types'

const { Title, Text } = Typography

const statusColors: Record<string, string> = {
  pending: 'orange', confirmed: 'green', cancel_requested: 'volcano',
  cancelled: 'red', completed: 'blue', paid: 'green',
}
const statusLabel: Record<string, string> = {
  pending: '待確認', confirmed: '已確認', cancel_requested: '申請取消中',
  cancelled: '已取消', completed: '已完成',
}
const genderLabel: Record<string, string> = { male: '男', female: '女', other: '其他' }

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{
        width: 40, height: 40, background: '#ECFDF5', borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <Text style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 2 }}>{label}</Text>
        <Text strong style={{ color: value === '尚未填寫' ? '#94A3B8' : '#1E293B', fontSize: 15, fontWeight: value === '尚未填寫' ? 400 : 600 }}>
          {value}
        </Text>
      </div>
    </div>
  )
}

export default function CustomerDashboard() {
  const qc = useQueryClient()
  const [profileForm] = Form.useForm()

  const { data: bookingsRes } = useQuery({ queryKey: ['my-bookings'], queryFn: bookingApi.listMine })
  const { data: ordersRes } = useQuery({ queryKey: ['my-orders'], queryFn: ordersApi.listMine })
  const { data: meRes } = useQuery({ queryKey: ['me'], queryFn: authApi.me })
  const me = meRes?.data

  const updateProfileMutation = useMutation({
    mutationFn: usersApi.updateMyProfile,
    onSuccess: () => {
      message.success('資料已儲存')
      qc.invalidateQueries({ queryKey: ['me'] })
      profileForm.resetFields()
    },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '儲存失敗'),
  })

  const cancelMutation = useMutation({
    mutationFn: bookingApi.cancel,
    onSuccess: () => {
      message.success('已送出取消申請，等待店長確認')
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
    },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '申請失敗'),
  })

  const hasBlankField = me && (!me.email || !me.line_id || !me.birthday || !me.gender)

  const profileTab = (
    <div>
      {/* 標題 */}
      <div style={{ marginBottom: 32 }}>
        <Title level={4} style={{ color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: 'linear-gradient(135deg, #059669, #10B981)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UserOutlined style={{ color: 'white', fontSize: 16 }} />
          </div>
          我的資料
        </Title>
      </div>

      <Row gutter={[24, 24]} justify="center">
        {/* 資料顯示卡 */}
        <Col xs={24} md={12} lg={10}>
          <Card
            title={<Text strong style={{ color: '#1E293B' }}>基本資料</Text>}
            style={{ border: '1px solid #E2E8F0', background: 'linear-gradient(135deg, #F8FAFC, #F0FDF4)', height: '100%' }}
            styles={{ body: { padding: 28 } }}
          >
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              <InfoRow icon={<UserOutlined style={{ color: '#059669', fontSize: 17 }} />} label="姓名" value={me?.name ?? '-'} />
              <InfoRow icon={<PhoneOutlined style={{ color: '#059669', fontSize: 17 }} />} label="手機" value={me?.phone ?? '-'} />
              <InfoRow icon={<MailOutlined style={{ color: '#059669', fontSize: 17 }} />} label="Email" value={me?.email || '尚未填寫'} />
              <InfoRow icon={<CommentOutlined style={{ color: '#059669', fontSize: 17 }} />} label="Line ID" value={me?.line_id || '尚未填寫'} />
              <InfoRow
                icon={<CalendarOutlined style={{ color: '#059669', fontSize: 17 }} />}
                label="生日"
                value={me?.birthday ? dayjs(me.birthday).format('YYYY / MM / DD') : '尚未填寫'}
              />
              <InfoRow
                icon={<ManOutlined style={{ color: '#059669', fontSize: 17 }} />}
                label="性別"
                value={me?.gender ? (genderLabel[me.gender] ?? me.gender) : '尚未填寫'}
              />
            </Space>
          </Card>
        </Col>

        {/* 填寫欄位卡 */}
        {hasBlankField && (
          <Col xs={24} md={12} lg={10}>
            <Card
              title={<Text strong style={{ color: '#1E293B' }}>填寫未填欄位</Text>}
              style={{ border: '1px solid #E2E8F0', background: 'linear-gradient(135deg, #F8FAFC, #F0FDF4)', height: '100%' }}
              styles={{ body: { padding: 28 } }}
            >
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={(v) => {
                  updateProfileMutation.mutate({
                    email: v.email || '',
                    line_id: v.line_id || '',
                    birthday: v.birthday ? v.birthday.toISOString() : null,
                    gender: v.gender || '',
                  })
                }}
              >
                {!me?.email && (
                  <Form.Item label="Email" name="email">
                    <Input placeholder="請輸入 Email" />
                  </Form.Item>
                )}
                {!me?.line_id && (
                  <Form.Item label="Line ID" name="line_id">
                    <Input placeholder="請輸入 Line ID" />
                  </Form.Item>
                )}
                {!me?.birthday && (
                  <Form.Item label="生日" name="birthday">
                    <DatePicker style={{ width: '100%' }} format="YYYY/MM/DD" placeholder="請選擇生日" />
                  </Form.Item>
                )}
                {!me?.gender && (
                  <Form.Item label="性別" name="gender">
                    <Select placeholder="請選擇性別">
                      <Select.Option value="male">男</Select.Option>
                      <Select.Option value="female">女</Select.Option>
                      <Select.Option value="other">其他</Select.Option>
                    </Select>
                  </Form.Item>
                )}
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" loading={updateProfileMutation.isPending} block>
                    儲存
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  )

  const bookingCols = [
    { title: '教練', key: 'coach', render: (_: unknown, r: Booking) => r.coach?.name ?? '-' },
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
        if (r.status !== 'pending' && r.status !== 'confirmed') return null
        return (
          <Popconfirm
            title="申請取消此預約？"
            description="送出後需等待店長審核才會正式取消。"
            okText="送出申請"
            okButtonProps={{ danger: true }}
            cancelText="返回"
            onConfirm={() => cancelMutation.mutate(r.id)}
          >
            <Button size="small" danger loading={cancelMutation.isPending}>申請取消</Button>
          </Popconfirm>
        )
      },
    },
  ]

  const orderCols = [
    { title: '訂單 ID', dataIndex: 'id', key: 'id', width: 310 },
    { title: '金額', key: 'total', render: (_: unknown, r: Order) => `NT$ ${Number(r.total_amount).toLocaleString()}` },
    { title: '狀態', key: 'status', render: (_: unknown, r: Order) => <Tag color={statusColors[r.status]}>{r.status}</Tag> },
    { title: '下單時間', key: 'time', render: (_: unknown, r: Order) => dayjs(r.created_at).format('YYYY/MM/DD HH:mm') },
  ]

  const items = [
    { key: 'profile', label: '我的資料', children: profileTab },
    { key: 'bookings', label: '我的預約', children: <Table dataSource={bookingsRes?.data} columns={bookingCols} rowKey="id" /> },
    { key: 'orders', label: '我的訂單', children: <Table dataSource={ordersRes?.data} columns={orderCols} rowKey="id" /> },
  ]

  return <Tabs items={items} />
}
