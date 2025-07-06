"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes (benchmark data doesn't change frequently)
        staleTime: 5 * 60 * 1000,
        // Keep cache for 30 minutes after component unmount
        gcTime: 30 * 60 * 1000,
        // Don't refetch on window focus to avoid unnecessary requests
        refetchOnWindowFocus: false,
        // Refetch on reconnect in case data changed while offline
        refetchOnReconnect: true,
        // Retry failed requests with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Enable background refetching for better UX
        refetchOnMount: 'always',
        // Refetch every 10 minutes in the background
        refetchInterval: 10 * 60 * 1000,
        // Only refetch in background if window is focused
        refetchIntervalInBackground: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}