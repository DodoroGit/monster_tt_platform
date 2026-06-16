import { Tabs, Table, Tag, Button, Form, Input, InputNumber, Select, message, Modal, Upload, Popconfirm, Space, DatePicker, TimePicker, Card, Statistic, Divider, Empty } from 'antd'
import { PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, TeamOutlined, ExperimentOutlined, LockOutlined, TrophyOutlined, DollarOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { ordersApi } from '@/api/orders'
import { usersApi } from '@/api/users'
import { bookingApi } from '@/api/booking'
import { coachesApi } from '@/api/coaches'
import { trialBookingApi } from '@/api/trialBooking'
import { settingsApi } from '@/api/settings'
import { awardsApi } from '@/api/awards'
import dayjs from 'dayjs'
import { useState } from 'react'
import type { Product, Order, User, Booking, CoachAvailability, TrialBooking } from '@/types'

interface SalaryResult {
  sessions: Booking[]
  totalMinutes: number
  total: number
}


const statusColors: Record<string, string> = {
  pending: 'orange', paid: 'green', completed: 'blue', cancelled: 'red',
  on_shelf: 'green', off_shelf: 'default',
}

export default function OwnerDashboard() {
  const qc = useQueryClient()
  const [productModal, setProductModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [userModal, setUserModal] = useState(false)
  const [imageProductId, setImageProductId] = useState<string | null>(null)
  const [productForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [userForm] = Form.useForm()

  const { data: productsRes } = useQuery({ queryKey: ['all-products'], queryFn: () => productsApi.list(true) })
  const { data: ordersRes } = useQuery({ queryKey: ['all-orders'], queryFn: ordersApi.listAll })
  const { data: usersRes } = useQuery({ queryKey: ['users'], queryFn: usersApi.list })

  const createProductMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => { message.success('商品已新增'); qc.invalidateQueries({ queryKey: ['all-products'] }); setProductModal(false) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '失敗'),
  })

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; description: string; price: number; stock: number }> }) =>
      productsApi.update(id, data),
    onSuccess: () => { message.success('商品已更新'); qc.invalidateQueries({ queryKey: ['all-products'] }); setEditModal(false) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '更新失敗'),
  })

  const deleteProductMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => { message.success('商品已刪除'); qc.invalidateQueries({ queryKey: ['all-products'] }) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '刪除失敗'),
  })

  const patchStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'on_shelf' | 'off_shelf' }) => productsApi.patchStatus(id, status),
    onSuccess: () => { message.success('狀態已更新'); qc.invalidateQueries({ queryKey: ['all-products'] }) },
  })

  const patchOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.patchStatus(id, status),
    onSuccess: () => { message.success('訂單狀態已更新'); qc.invalidateQueries({ queryKey: ['all-orders'] }) },
  })

  const deleteOrderMutation = useMutation({
    mutationFn: ordersApi.delete,
    onSuccess: () => { message.success('訂單已刪除'); qc.invalidateQueries({ queryKey: ['all-orders'] }) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '刪除失敗'),
  })

  const createUserMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => { message.success('帳號已建立'); qc.invalidateQueries({ queryKey: ['users'] }); setUserModal(false) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '失敗'),
  })

  const patchRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.patchRole(id, role),
    onSuccess: () => { message.success('角色已更新'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '更新失敗'),
  })

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => productsApi.uploadImage(id, file),
    onSuccess: () => { message.success('圖片上傳成功'); qc.invalidateQueries({ queryKey: ['all-products'] }) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '上傳失敗'),
  })

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    editForm.setFieldsValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
    })
    setEditModal(true)
  }

  const productCols = [
    { title: '名稱', dataIndex: 'name', key: 'name' },
    { title: '價格', key: 'price', render: (_: unknown, r: Product) => `NT$ ${Number(r.price).toLocaleString()}` },
    { title: '庫存', dataIndex: 'stock', key: 'stock' },
    {
      title: '狀態', key: 'status',
      render: (_: unknown, r: Product) => <Tag color={statusColors[r.status]}>{r.status === 'on_shelf' ? '上架中' : '已下架'}</Tag>,
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, r: Product) => (
        <Space size={4}>
          <Button
            size="small"
            onClick={() => patchStatusMutation.mutate({ id: r.id, status: r.status === 'on_shelf' ? 'off_shelf' : 'on_shelf' })}
          >
            {r.status === 'on_shelf' ? '下架' : '上架'}
          </Button>
          <Button size="small" icon={<UploadOutlined />} onClick={() => setImageProductId(r.id)}>圖片</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)}>編輯</Button>
          <Popconfirm
            title="確認刪除此商品？"
            description="刪除後無法復原。"
            okText="刪除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => deleteProductMutation.mutate(r.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} loading={deleteProductMutation.isPending}>刪除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const orderCols = [
    { title: '顧客', key: 'customer', render: (_: unknown, r: Order) => r.customer?.name },
    { title: '金額', key: 'total', render: (_: unknown, r: Order) => `NT$ ${Number(r.total_amount).toLocaleString()}` },
    { title: '狀態', key: 'status', render: (_: unknown, r: Order) => <Tag color={statusColors[r.status]}>{{ pending: '待處理', paid: '已付款', completed: '已完成', cancelled: '已取消' }[r.status] ?? r.status}</Tag> },
    { title: '時間', key: 'time', render: (_: unknown, r: Order) => dayjs(r.created_at).format('MM/DD HH:mm') },
    {
      title: '更新狀態', key: 'update',
      render: (_: unknown, r: Order) => (
        <Select defaultValue={r.status} size="small" style={{ width: 120 }}
          onChange={(v) => patchOrderStatusMutation.mutate({ id: r.id, status: v })}>
          {[
            { value: 'pending', label: '待處理' },
            { value: 'paid', label: '已付款' },
            { value: 'completed', label: '已完成' },
            { value: 'cancelled', label: '已取消' },
          ].map((s) => (
            <Select.Option key={s.value} value={s.value}>{s.label}</Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '刪除', key: 'delete',
      render: (_: unknown, r: Order) => (
        <Popconfirm
          title="確認刪除此筆訂單？"
          description="刪除後無法復原。"
          okText="刪除"
          okButtonProps={{ danger: true }}
          cancelText="取消"
          onConfirm={() => deleteOrderMutation.mutate(r.id)}
        >
          <Button danger size="small" icon={<DeleteOutlined />} loading={deleteOrderMutation.isPending} />
        </Popconfirm>
      ),
    },
  ]

  const roleOptions = [
    { value: 'customer', label: '顧客' },
    { value: 'coach', label: '教練' },
    { value: 'owner', label: '店長' },
  ]

  const userCols = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: '電話', dataIndex: 'phone', key: 'phone' },
    {
      title: '角色', key: 'role',
      render: (_: unknown, r: User) => (
        <Select
          value={r.role}
          size="small"
          style={{ width: 100 }}
          loading={patchRoleMutation.isPending}
          onChange={(role) => patchRoleMutation.mutate({ id: r.id, role })}
          options={roleOptions}
        />
      ),
    },
  ]

  // ── 班表管理 state ──
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)
  const { data: coachesRes } = useQuery({ queryKey: ['coaches'], queryFn: coachesApi.list })

  const { data: coachAvailRes, refetch: refetchAvail } = useQuery({
    queryKey: ['owner-avail', selectedCoachId],
    queryFn: () => bookingApi.listCoachAvailabilities(selectedCoachId!),
    enabled: !!selectedCoachId,
  })

  const createAvailMutation = useMutation({
    mutationFn: (data: { start_time: string; end_time: string; coach_id: string }) =>
      bookingApi.createAvailabilityForCoach(data),
    onSuccess: () => { message.success('時段已新增'); refetchAvail() },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '失敗'),
  })

  const deleteAvailMutation = useMutation({
    mutationFn: bookingApi.deleteAvailability,
    onSuccess: () => { message.success('時段已刪除'); refetchAvail() },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '失敗'),
  })

  // ── 試教管理 ──
  const { data: trialRes, refetch: refetchTrials } = useQuery({ queryKey: ['trial-bookings'], queryFn: trialBookingApi.listAll })
  const { data: trialPwdRes } = useQuery({ queryKey: ['trial-password'], queryFn: settingsApi.getTrialPassword })
  const [trialPwdForm] = Form.useForm()

  const approveTrialMutation = useMutation({
    mutationFn: trialBookingApi.approve,
    onSuccess: () => { message.success('已核准試教'); refetchTrials() },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '操作失敗'),
  })

  const rejectTrialMutation = useMutation({
    mutationFn: trialBookingApi.reject,
    onSuccess: () => { message.success('已拒絕試教'); refetchTrials() },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '操作失敗'),
  })

  const deleteTrialMutation = useMutation({
    mutationFn: trialBookingApi.delete,
    onSuccess: () => { message.success('記錄已刪除'); refetchTrials() },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '刪除失敗'),
  })

  const setTrialPwdMutation = useMutation({
    mutationFn: (pwd: string) => settingsApi.setTrialPassword(pwd),
    onSuccess: () => { message.success('試教密碼已更新'); qc.invalidateQueries({ queryKey: ['trial-password'] }) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '更新失敗'),
  })

  // ── 獲獎榮譽管理 ──
  const { data: awardsRes } = useQuery({ queryKey: ['awards'], queryFn: awardsApi.list })
  const [awardForm] = Form.useForm()

  const createAwardMutation = useMutation({
    mutationFn: awardsApi.create,
    onSuccess: () => { message.success('獎項已新增'); awardForm.resetFields(); qc.invalidateQueries({ queryKey: ['awards'] }) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '新增失敗'),
  })

  const deleteAwardMutation = useMutation({
    mutationFn: awardsApi.delete,
    onSuccess: () => { message.success('獎項已刪除'); qc.invalidateQueries({ queryKey: ['awards'] }) },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '刪除失敗'),
  })

  // ── 薪資計算 ──
  const [salaryCoachId, setSalaryCoachId] = useState<string | null>(null)
  const [salaryRange, setSalaryRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [salaryRate, setSalaryRate] = useState<number | null>(null)
  const [salaryResult, setSalaryResult] = useState<SalaryResult | null>(null)

  // ── 預約總覽 ──
  const { data: allBookingsRes, refetch: refetchAllBookings } = useQuery({ queryKey: ['all-bookings'], queryFn: bookingApi.listAll })
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null)
  const [rescheduleForm] = Form.useForm()

  const deleteBookingMutation = useMutation({
    mutationFn: bookingApi.deleteBooking,
    onSuccess: () => { message.success('記錄已刪除'); refetchAllBookings() },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '刪除失敗'),
  })

  const approveCancelMutation = useMutation({
    mutationFn: bookingApi.approveCancel,
    onSuccess: () => { message.success('已同意取消，預約已取消'); refetchAllBookings() },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '操作失敗'),
  })

  const rejectCancelMutation = useMutation({
    mutationFn: bookingApi.rejectCancel,
    onSuccess: () => { message.success('已拒絕取消申請，預約維持'); refetchAllBookings() },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '操作失敗'),
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { booking_start: string; booking_end: string } }) =>
      bookingApi.reschedule(id, data),
    onSuccess: () => {
      message.success('預約時段已修改')
      setRescheduleTarget(null)
      rescheduleForm.resetFields()
      refetchAllBookings()
    },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '修改失敗'),
  })

  const approveTrialCancelMutation = useMutation({
    mutationFn: trialBookingApi.approveCancel,
    onSuccess: () => { message.success('已同意取消，試教已取消'); refetchTrials() },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '操作失敗'),
  })

  const rejectTrialCancelMutation = useMutation({
    mutationFn: trialBookingApi.rejectCancel,
    onSuccess: () => { message.success('已拒絕取消申請，試教維持'); refetchTrials() },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '操作失敗'),
  })

  const trialStatusLabel: Record<string, string> = {
    pending: '待審核', approved: '已核准', rejected: '已拒絕', cancel_requested: '申請取消中', cancelled: '已取消',
  }
  const trialStatusColor: Record<string, string> = {
    pending: 'orange', approved: 'green', rejected: 'red', cancel_requested: 'volcano', cancelled: 'red',
  }

  const trialCols = [
    { title: '申請人', dataIndex: 'guest_name', key: 'guest_name' },
    { title: '手機', dataIndex: 'guest_phone', key: 'guest_phone' },
    { title: '教練', key: 'coach', render: (_: unknown, r: TrialBooking) => r.coach?.name ?? '-' },
    {
      title: '時段', key: 'time',
      render: (_: unknown, r: TrialBooking) =>
        `${dayjs(r.booking_start).format('MM/DD HH:mm')} – ${dayjs(r.booking_end).format('HH:mm')}`,
    },
    {
      title: '狀態', key: 'status',
      render: (_: unknown, r: TrialBooking) => (
        <Tag color={trialStatusColor[r.status]}>{trialStatusLabel[r.status] ?? r.status}</Tag>
      ),
    },
    { title: '申請時間', key: 'created', render: (_: unknown, r: TrialBooking) => dayjs(r.created_at).format('MM/DD HH:mm') },
    {
      title: '刪除', key: 'delete',
      render: (_: unknown, r: TrialBooking) => (
        <Popconfirm
          title="確認刪除此筆記錄？"
          description="刪除後無法復原。"
          okText="刪除"
          okButtonProps={{ danger: true }}
          cancelText="取消"
          onConfirm={() => deleteTrialMutation.mutate(r.id)}
        >
          <Button danger size="small" icon={<DeleteOutlined />} loading={deleteTrialMutation.isPending} />
        </Popconfirm>
      ),
    },
    {
      title: '審核', key: 'action',
      render: (_: unknown, r: TrialBooking) => {
        if (r.status !== 'pending') return null
        return (
          <Space size={4}>
            <Popconfirm
              title="確認核准此試教申請？"
              okText="核准"
              cancelText="取消"
              onConfirm={() => approveTrialMutation.mutate(r.id)}
            >
              <Button type="primary" size="small" loading={approveTrialMutation.isPending}>核准</Button>
            </Popconfirm>
            <Popconfirm
              title="確認拒絕此試教申請？"
              okText="拒絕"
              okButtonProps={{ danger: true }}
              cancelText="取消"
              onConfirm={() => rejectTrialMutation.mutate(r.id)}
            >
              <Button danger size="small" loading={rejectTrialMutation.isPending}>拒絕</Button>
            </Popconfirm>
          </Space>
        )
      },
    },
    {
      title: '審核取消', key: 'cancel-action',
      render: (_: unknown, r: TrialBooking) => {
        if (r.status !== 'cancel_requested') return null
        return (
          <Space size={4}>
            <Popconfirm
              title="同意取消此試教？"
              okText="同意取消"
              okButtonProps={{ danger: true }}
              cancelText="返回"
              onConfirm={() => approveTrialCancelMutation.mutate(r.id)}
            >
              <Button danger size="small" loading={approveTrialCancelMutation.isPending}>同意取消</Button>
            </Popconfirm>
            <Popconfirm
              title="拒絕此取消申請？"
              description="拒絕後試教將恢復原狀。"
              okText="拒絕申請"
              cancelText="返回"
              onConfirm={() => rejectTrialCancelMutation.mutate(r.id)}
            >
              <Button size="small" loading={rejectTrialCancelMutation.isPending}>拒絕申請</Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  const bookingStatusLabel: Record<string, string> = {
    pending: '待確認', confirmed: '已確認', cancel_requested: '申請取消中', cancelled: '已取消', completed: '已完成',
  }
  const bookingStatusColor: Record<string, string> = {
    pending: 'orange', confirmed: 'green', cancel_requested: 'volcano', cancelled: 'red', completed: 'blue',
  }

  const allBookingCols = [
    { title: '學員', key: 'customer', render: (_: unknown, r: Booking) => r.customer?.name ?? '-' },
    { title: '教練', key: 'coach', render: (_: unknown, r: Booking) => r.coach?.name ?? '-' },
    {
      title: '時段', key: 'time',
      render: (_: unknown, r: Booking) =>
        r.availability
          ? `${dayjs(r.booking_start).format('MM/DD HH:mm')} – ${dayjs(r.booking_end).format('HH:mm')}`
          : '-',
    },
    {
      title: '狀態', key: 'status',
      render: (_: unknown, r: Booking) => (
        <Tag color={bookingStatusColor[r.status]}>{bookingStatusLabel[r.status] ?? r.status}</Tag>
      ),
    },
    { title: '申請時間', key: 'created', render: (_: unknown, r: Booking) => dayjs(r.created_at).format('MM/DD HH:mm') },
    {
      title: '修改時段', key: 'reschedule',
      render: (_: unknown, r: Booking) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setRescheduleTarget(r)
            rescheduleForm.setFieldsValue({
              date: dayjs(r.booking_start),
              startTime: dayjs(r.booking_start),
              endTime: dayjs(r.booking_end),
            })
          }}
        >
          修改
        </Button>
      ),
    },
    {
      title: '刪除', key: 'delete',
      render: (_: unknown, r: Booking) => (
        <Popconfirm
          title="確認刪除此筆記錄？"
          description="刪除後無法復原。"
          okText="刪除"
          okButtonProps={{ danger: true }}
          cancelText="取消"
          onConfirm={() => deleteBookingMutation.mutate(r.id)}
        >
          <Button danger size="small" icon={<DeleteOutlined />} loading={deleteBookingMutation.isPending} />
        </Popconfirm>
      ),
    },
    {
      title: '審核取消', key: 'cancel-action',
      render: (_: unknown, r: Booking) => {
        if (r.status !== 'cancel_requested') return null
        return (
          <Space size={4}>
            <Popconfirm
              title="同意取消此預約？"
              okText="同意取消"
              okButtonProps={{ danger: true }}
              cancelText="返回"
              onConfirm={() => approveCancelMutation.mutate(r.id)}
            >
              <Button danger size="small" loading={approveCancelMutation.isPending}>同意取消</Button>
            </Popconfirm>
            <Popconfirm
              title="拒絕此取消申請？"
              description="拒絕後預約將恢復原狀。"
              okText="拒絕申請"
              cancelText="返回"
              onConfirm={() => rejectCancelMutation.mutate(r.id)}
            >
              <Button size="small" loading={rejectCancelMutation.isPending}>拒絕申請</Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  const availCols = [
    { title: '開始時間', key: 'start', render: (_: unknown, r: CoachAvailability) => dayjs(r.start_time).format('YYYY/MM/DD HH:mm') },
    { title: '結束時間', key: 'end', render: (_: unknown, r: CoachAvailability) => dayjs(r.end_time).format('HH:mm') },
    {
      title: '狀態', key: 'status',
      render: (_: unknown, r: CoachAvailability) => (
        <Tag color={r.status === 'available' ? 'green' : r.status === 'booked' ? 'red' : 'default'}>
          {{ available: '可預約', booked: '已預約', cancelled: '已取消' }[r.status] ?? r.status}
        </Tag>
      ),
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, r: CoachAvailability) => (
        <Popconfirm
          title="確認刪除此時段？"
          description={r.status === 'booked' ? '此時段已有學員預約，刪除後預約記錄仍會保留。' : '刪除後無法復原。'}
          okText="刪除"
          okButtonProps={{ danger: true }}
          cancelText="取消"
          onConfirm={() => deleteAvailMutation.mutate(r.id)}
        >
          <Button danger size="small" icon={<DeleteOutlined />}>刪除</Button>
        </Popconfirm>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'products', label: '商品管理',
      children: (
        <>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { productForm.resetFields(); setProductModal(true) }} style={{ marginBottom: 16 }}>
            新增商品
          </Button>
          <Table dataSource={productsRes?.data} columns={productCols} rowKey="id" />
        </>
      ),
    },
    {
      key: 'orders', label: '訂單管理',
      children: <Table dataSource={ordersRes?.data} columns={orderCols} rowKey="id" />,
    },
    {
      key: 'users', label: '帳號管理',
      children: (
        <>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { userForm.resetFields(); setUserModal(true) }} style={{ marginBottom: 16 }}>
            新增帳號
          </Button>
          <Table dataSource={usersRes?.data} columns={userCols} rowKey="id" />
        </>
      ),
    },
    {
      key: 'schedule', label: <span><CalendarOutlined /> 班表管理</span>,
      children: (
        <div>
          {/* 選擇教練 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <span style={{ fontWeight: 600, color: '#0F172A', flexShrink: 0 }}>選擇教練：</span>
            <Select
              placeholder="請選擇教練"
              style={{ width: 200 }}
              value={selectedCoachId}
              onChange={setSelectedCoachId}
            >
              {(coachesRes?.data ?? []).map((c) => (
                <Select.Option key={c.id} value={c.user_id}>{c.user?.name ?? '教練'}</Select.Option>
              ))}
            </Select>
          </div>

          {selectedCoachId && (
            <>
              {/* 新增時段 */}
              <Form
                layout="inline"
                style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}
                onFinish={(v) => {
                  const date = v.date.format('YYYY-MM-DD')
                  const start = dayjs(`${date} ${v.startTime.format('HH:mm')}`)
                  const end = dayjs(`${date} ${v.endTime.format('HH:mm')}`)
                  if (!end.isAfter(start)) {
                    message.error('結束時間必須晚於開始時間')
                    return
                  }
                  createAvailMutation.mutate({
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                    coach_id: selectedCoachId!,
                  })
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
                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={createAvailMutation.isPending}>
                    新增時段
                  </Button>
                </Form.Item>
              </Form>

              <Table
                dataSource={coachAvailRes?.data}
                columns={availCols}
                rowKey="id"
                size="small"
                locale={{ emptyText: '目前無時段' }}
              />
            </>
          )}

          {!selectedCoachId && (
            <div style={{ color: '#94A3B8', textAlign: 'center', padding: '60px 0' }}>
              請先選擇教練以管理其班表
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'bookings-overview', label: <span><TeamOutlined /> 預約總覽</span>,
      children: (
        <div>
          <div style={{ fontWeight: 600, color: '#1D4ED8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TeamOutlined /> 一般預約
          </div>
          <Table
            dataSource={allBookingsRes?.data}
            columns={allBookingCols}
            rowKey="id"
            size="small"
            locale={{ emptyText: '目前無預約記錄' }}
          />
          {/* 審核通過的試教也顯示在此 */}
          {(trialRes?.data ?? []).filter((t) => t.status === 'approved').length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 600, color: '#9A3412', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ExperimentOutlined /> 已核准的試教預約
              </div>
              <Table
                dataSource={(trialRes?.data ?? []).filter((t) => t.status === 'approved')}
                columns={trialCols}
                rowKey="id"
                size="small"
                locale={{ emptyText: '目前無已核准試教' }}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'trial', label: <span><ExperimentOutlined /> 試教管理</span>,
      children: (
        <div>
          {/* 試教密碼設定 */}
          <Card
            size="small"
            style={{ marginBottom: 24, border: '1px solid #FED7AA', background: '#FFF7ED' }}
            title={
              <span style={{ color: '#9A3412', fontWeight: 600 }}>
                <LockOutlined style={{ marginRight: 6 }} />試教密碼設定
              </span>
            }
          >
            <div style={{ marginBottom: 8, fontSize: 13, color: '#92400E' }}>
              目前密碼：<strong>{trialPwdRes?.data?.password || '（尚未設定）'}</strong>
            </div>
            <Form
              form={trialPwdForm}
              layout="inline"
              onFinish={(v) => { setTrialPwdMutation.mutate(v.password); trialPwdForm.resetFields() }}
            >
              <Form.Item name="password" rules={[{ required: true, message: '請輸入新密碼' }]}>
                <Input.Password placeholder="輸入新的試教密碼" style={{ width: 220 }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={setTrialPwdMutation.isPending}>
                  更新密碼
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* 試教申請列表 */}
          <Table
            dataSource={trialRes?.data}
            columns={trialCols}
            rowKey="id"
            size="small"
            locale={{ emptyText: '目前無試教申請' }}
          />
        </div>
      ),
    },
    {
      key: 'awards', label: <span><TrophyOutlined /> 獲獎榮譽</span>,
      children: (
        <div>
          <Form
            form={awardForm}
            layout="inline"
            style={{ marginBottom: 20, gap: 8, flexWrap: 'wrap' }}
            onFinish={(v) => createAwardMutation.mutate(v)}
          >
            <Form.Item name="year" rules={[{ required: true, message: '請輸入年份' }]}>
              <Input placeholder="年份（如 2024）" style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="title" rules={[{ required: true, message: '請輸入獎項名稱' }]} style={{ flex: 1, minWidth: 240 }}>
              <Input placeholder="獎項名稱（如：全國桌球錦標賽 團體金牌）" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={createAwardMutation.isPending}>
                新增獎項
              </Button>
            </Form.Item>
          </Form>
          <Table
            dataSource={awardsRes?.data}
            rowKey="id"
            size="small"
            locale={{ emptyText: '尚未新增任何獎項' }}
            columns={[
              { title: '年份', dataIndex: 'year', key: 'year', width: 90 },
              { title: '獎項名稱', dataIndex: 'title', key: 'title' },
              {
                title: '操作', key: 'action', width: 80,
                render: (_: unknown, r: { id: string }) => (
                  <Popconfirm
                    title="確定刪除此獎項？"
                    okText="刪除"
                    okButtonProps={{ danger: true }}
                    cancelText="取消"
                    onConfirm={() => deleteAwardMutation.mutate(r.id)}
                  >
                    <Button danger size="small" icon={<DeleteOutlined />} loading={deleteAwardMutation.isPending} />
                  </Popconfirm>
                ),
              },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'salary', label: <span><DollarOutlined /> 教練薪資</span>,
      children: (() => {
        const coaches = (usersRes?.data ?? []).filter((u: User) => u.role === 'coach')

        const calculate = () => {
          if (!salaryCoachId || !salaryRange || !salaryRate) {
            message.warning('請填寫所有欄位')
            return
          }
          const [from, to] = salaryRange
          const sessions = (allBookingsRes?.data ?? []).filter((b: Booking) => {
            if (b.coach_id !== salaryCoachId) return false
            if (b.status === 'cancelled') return false
            const start = dayjs(b.booking_start)
            return !start.isBefore(from.startOf('day')) && !start.isAfter(to.endOf('day'))
          })
          const totalMinutes = sessions.reduce((sum: number, b: Booking) =>
            sum + dayjs(b.booking_end).diff(dayjs(b.booking_start), 'minute'), 0)
          setSalaryResult({ sessions, totalMinutes, total: (totalMinutes / 60) * salaryRate })
        }

        const selectedCoachName = coaches.find((u: User) => u.id === salaryCoachId)?.name ?? ''

        return (
          <div style={{ maxWidth: 860 }}>
            {/* 輸入區 */}
            <Card style={{ marginBottom: 24, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#64748B', marginBottom: 6 }}>選擇教練</div>
                  <Select
                    style={{ width: 160 }}
                    placeholder="請選擇教練"
                    value={salaryCoachId}
                    onChange={(v) => { setSalaryCoachId(v); setSalaryResult(null) }}
                    options={coaches.map((u: User) => ({ value: u.id, label: u.name }))}
                  />
                </div>
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

            {/* 計算結果 */}
            {salaryResult && (
              <Card
                style={{ border: '1px solid #D1FAE5', background: '#F0FDF4' }}
                title={
                  <span style={{ color: '#065F46', fontWeight: 700 }}>
                    <DollarOutlined style={{ marginRight: 8 }} />
                    {selectedCoachName}・{salaryRange![0].format('YYYY/MM/DD')} ~ {salaryRange![1].format('YYYY/MM/DD')}
                  </span>
                }
              >
                {/* 統計數字 */}
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
                    title="應付薪資"
                    prefix="NT$"
                    value={salaryResult.total.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    valueStyle={{ color: '#DC2626', fontWeight: 800, fontSize: 28 }}
                  />
                </div>

                <Divider style={{ margin: '12px 0' }} />

                {/* 明細表 */}
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
                        title: '顧客', key: 'customer',
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
      <Tabs items={tabItems} />

      {/* 新增商品 */}
      <Modal
        title="新增商品"
        open={productModal}
        onCancel={() => setProductModal(false)}
        onOk={() => productForm.submit()}
        confirmLoading={createProductMutation.isPending}
      >
        <Form form={productForm} layout="vertical" onFinish={(v) => createProductMutation.mutate(v)}>
          <Form.Item label="名稱" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="描述" name="description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="價格" name="price" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} prefix="NT$" />
          </Form.Item>
          <Form.Item label="庫存" name="stock" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 編輯商品 */}
      <Modal
        title="編輯商品"
        open={editModal}
        onCancel={() => setEditModal(false)}
        onOk={() => editForm.submit()}
        confirmLoading={updateProductMutation.isPending}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(v) => editingProduct && updateProductMutation.mutate({ id: editingProduct.id, data: v })}
        >
          <Form.Item label="名稱" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="描述" name="description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="價格" name="price" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} prefix="NT$" />
          </Form.Item>
          <Form.Item label="庫存數量" name="stock" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新增帳號 */}
      <Modal
        title="新增帳號"
        open={userModal}
        onCancel={() => setUserModal(false)}
        onOk={() => userForm.submit()}
        confirmLoading={createUserMutation.isPending}
      >
        <Form form={userForm} layout="vertical" onFinish={(v) => createUserMutation.mutate(v)}>
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '請輸入姓名' }]}><Input /></Form.Item>
          <Form.Item label="電話" name="phone" rules={[{ required: true, message: '請輸入電話' }]}><Input /></Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="coach">教練</Select.Option>
              <Select.Option value="owner">店長</Select.Option>
              <Select.Option value="customer">顧客</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 修改預約時段 */}
      <Modal
        title={`修改預約時段 — ${rescheduleTarget?.customer?.name ?? ''}`}
        open={!!rescheduleTarget}
        onCancel={() => { setRescheduleTarget(null); rescheduleForm.resetFields() }}
        onOk={() => rescheduleForm.submit()}
        confirmLoading={rescheduleMutation.isPending}
        okText="確認修改"
      >
        <Form
          form={rescheduleForm}
          layout="vertical"
          onFinish={(v) => {
            if (!rescheduleTarget) return
            const date = v.date.format('YYYY-MM-DD')
            const start = dayjs(`${date} ${v.startTime.format('HH:mm')}`)
            const end = dayjs(`${date} ${v.endTime.format('HH:mm')}`)
            if (!end.isAfter(start)) {
              message.error('結束時間必須晚於開始時間')
              return
            }
            rescheduleMutation.mutate({
              id: rescheduleTarget.id,
              data: { booking_start: start.toISOString(), booking_end: end.toISOString() },
            })
          }}
        >
          <Form.Item label="日期" name="date" rules={[{ required: true, message: '請選擇日期' }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="開始時間" name="startTime" rules={[{ required: true, message: '請選擇開始時間' }]}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={30} />
          </Form.Item>
          <Form.Item label="結束時間" name="endTime" rules={[{ required: true, message: '請選擇結束時間' }]}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={30} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 上傳圖片 */}
      <Modal title="上傳商品圖片" open={!!imageProductId} onCancel={() => setImageProductId(null)} footer={null}>
        <Upload
          accept="image/*"
          showUploadList={false}
          customRequest={({ file, onSuccess }) => {
            uploadImageMutation.mutate({ id: imageProductId!, file: file as File })
            onSuccess?.('ok')
          }}
        >
          <Button icon={<UploadOutlined />} loading={uploadImageMutation.isPending}>選擇圖片上傳</Button>
        </Upload>
      </Modal>
    </>
  )
}
