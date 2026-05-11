import { useAuth } from '@clerk/clerk-react'
import { Navigate, Outlet } from 'react-router'

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f6f3ee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: 32 }}>🌿</div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  return <Outlet />
}
