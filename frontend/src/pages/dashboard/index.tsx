import { useAuth } from '@/store/auth'
import OwnerDashboard from './OwnerDashboard'
import CoachDashboard from './CoachDashboard'
import CustomerDashboard from './CustomerDashboard'

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
      {user.role === 'owner' ? <OwnerDashboard /> : user.role === 'coach' ? <CoachDashboard /> : <CustomerDashboard />}
    </div>
  )
}
