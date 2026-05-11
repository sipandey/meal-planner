import { createBrowserRouter } from 'react-router'
import ProtectedRoute from './pages/ProtectedRoute'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import OnboardingPage from './pages/OnboardingPage'
import SettingsPage from './pages/SettingsPage'
import App from './App'

export const router = createBrowserRouter([
  {
    // Wildcard needed — Clerk renders sub-routes like
    // /sign-in/factor-one, /sign-in/sso-callback, etc.
    path: '/sign-in/*',
    element: <SignInPage />,
  },
  {
    path: '/sign-up/*',
    element: <SignUpPage />,
  },
  {
    // All authenticated routes live under ProtectedRoute,
    // which handles the onboarding redirect logic.
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true,          element: <App /> },
      { path: 'onboarding',   element: <OnboardingPage /> },
      { path: 'settings',     element: <SettingsPage /> },
    ],
  },
])
