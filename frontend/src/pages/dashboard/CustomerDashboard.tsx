import { Tabs, Table, Tag, Button, message, Popconfirm } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingApi } from '@/api/booking'
import { ordersApi } from '@/api/orders'
import dayjs from 'dayjs'
import type { Booking, Order } from '@/types'

const statusColors: Record<string, string> = {
  pending: 'orange', confirmed: 'green', cancel_requested: 'volcano',
  cancelled: 'red', completed: 'blue', paid: 'green',
}
const statusLabel: Record<string, string> = {
  pending: '待確認', confirmed: '已確認', cancel_requested: '申請取消中',
  cancelled: '已取消', completed: '已完成',
}

export default function CustomerDashboard() {
  const qc = useQueryClient()

  const { data: bookingsRes } = useQuery({ queryKey: ['my-bookings'], queryFn: bookingApi.listMine })
  const { data: ordersRes } = useQuery({ queryKey: ['my-orders'], queryFn: ordersApi.listMine })

  const cancelMutation = useMutation({
    mutationFn: bookingApi.cancel,
    onSuccess: () => {
      message.success('已送出取消申請，等待店長確認')
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
    },
    onError: (e: unknown) => message.error(e instanceof Error ? e.message : '申請失敗'),
  })

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
    { key: 'bookings', label: '我的預約', children: <Table dataSource={bookingsRes?.data} columns={bookingCols} rowKey="id" /> },
    { key: 'orders', label: '我的訂單', children: <Table dataSource={ordersRes?.data} columns={orderCols} rowKey="id" /> },
  ]

  return <Tabs items={items} />
}
