import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { queryClient } from './lib/queryClient'
import { router } from './router'

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY — add it to .env.local')
}

export default function Root() {
  return (
    <ClerkProvider publishableKey={clerkKey} afterSignOutUrl="/sign-in">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ClerkProvider>
  )
}
