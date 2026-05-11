import { useAuth } from '@clerk/clerk-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useProfile } from '../hooks/useProfile'

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()
  const location = useLocation()

  // ── Spinner while Clerk or profile is loading ──────────────────
  if (!isLoaded || (isSignedIn && profileLoading)) {
    return (
      <div style={{
        minHeight: '100vh', background: '#f6f3ee',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
      }}>
        <div style={{ fontSize: 36 }}>🌿</div>
        <div style={{ fontSize: 13, color: '#6a7a6a' }}>Setting up your kitchen…</div>
      </div>
    )
  }

  // ── Not signed in → sign-in page ──────────────────────────────
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  // ── Signed in but not onboarded → onboarding wizard ───────────
  // Allow /onboarding itself to pass through to avoid infinite loop.
  const isOnboardingRoute = location.pathname === '/onboarding'
  if (!profile?.onboarded && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />
  }

  // ── Already onboarded, trying to go to /onboarding → home ─────
  if (profile?.onboarded && isOnboardingRoute) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
