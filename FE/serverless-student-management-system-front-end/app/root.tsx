import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import { useEffect } from 'react'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { configureAmplify } from './config/amplify-config'
import { useAuthStore } from './store/authStore'
import { Toaster } from './components/ui/toaster'
import './style/layout.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='vi'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' type='image/png' href='/Logo_AWS_FCJ.png' />
        <title>StudentManager Pro - LMS</title>
        <script src='https://cdn.tailwindcss.com'></script>
        <script src='https://accounts.google.com/gsi/client' async defer></script>
        <link
          href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
          rel='stylesheet'
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          body {
            font-family: 'Inter', sans-serif;
            background-color: #F3F4F6;
          }
          [data-scope="toast"][data-part="root"] {
            position: fixed !important;
            z-index: 9999 !important;
          }
          [data-scope="toast"][data-part="group"] {
            position: fixed !important;
            z-index: 9999 !important;
            pointer-events: none !important;
          }
          [data-scope="toast"][data-part="group"][data-placement="top-end"] {
            top: 10px!important;
            right: 10px !important;
          }
          [data-scope="toast"][data-part="group"][data-placement="bottom-end"] {
            bottom: 40px !important;
            right: 10px !important;
          }
        `
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider value={defaultSystem}>
            <Toaster />
            {children}
            <ScrollRestoration />
            <Scripts />
          </ChakraProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}

export default function Root() {
  const { checkAuthStatus } = useAuthStore()

  useEffect(() => {
    // Initialize Amplify configuration
    configureAmplify()

    // Check authentication status on app load
    checkAuthStatus()
  }, [])

  // Root just renders Outlet - layouts are handled by route config
  return <Outlet />
}
