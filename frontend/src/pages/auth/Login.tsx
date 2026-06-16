import { Form, Input, Button, Card, Typography, Alert } from 'antd'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '@/api/auth'
import { useAuth } from '@/store/auth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: { name: string; phone: string }) => {
    setErrorMsg(null)
    setLoading(true)
    try {
      const res = await authApi.login(values)
      if (res.error) throw new Error(res.error.message)
      login(res.data.token, res.data.user)
      navigate(from, { replace: true })
    } catch {
      setErrorMsg('姓名或電話錯誤，請確認後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '64px auto' }}>
      <Card>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>登入</Typography.Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '請輸入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="電話" name="phone" rules={[{ required: true, message: '請輸入電話' }]}>
            <Input />
          </Form.Item>
          {errorMsg && (
            <Form.Item>
              <Alert type="error" message={errorMsg} showIcon />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>登入</Button>
          </Form.Item>
        </Form>
        <Typography.Text>還沒有帳號？<Link to="/register">立即註冊</Link></Typography.Text>
      </Card>
    </div>
  )
}
