import { SignIn } from '@clerk/clerk-react'

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f6f3ee',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🌿</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1c2b1c', letterSpacing: '-0.02em' }}>
          Meal Planner
        </div>
        <div style={{ fontSize: 13, color: '#6a7a6a', marginTop: 4 }}>
          Personalised · Vegetarian · Nutrition-first
        </div>
      </div>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        appearance={{
          variables: {
            colorPrimary: '#2d6a4f',
            colorBackground: '#ffffff',
            colorText: '#1c2b1c',
            borderRadius: '10px',
          },
        }}
      />
    </div>
  )
}
