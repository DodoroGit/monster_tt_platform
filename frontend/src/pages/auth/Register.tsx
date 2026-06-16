import { Form, Input, Button, Card, Typography, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useAuth } from '@/store/auth'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values: { name: string; phone: string }) => {
    try {
      const res = await authApi.register(values)
      if (res.error) throw new Error(res.error.message)
      const loginRes = await authApi.login({ name: values.name, phone: values.phone })
      if (loginRes.error) throw new Error(loginRes.error.message)
      login(loginRes.data.token, loginRes.data.user)
      message.success('註冊成功，已自動登入')
      navigate('/')
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '註冊失敗')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '64px auto' }}>
      <Card>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>顧客註冊</Typography.Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '請輸入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="電話" name="phone" rules={[{ required: true, message: '請輸入電話' }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>註冊</Button>
          </Form.Item>
        </Form>
        <Typography.Text>已有帳號？<Link to="/login">立即登入</Link></Typography.Text>
      </Card>
    </div>
  )
}
