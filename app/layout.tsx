import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorker from '@/components/ServiceWorker'
import StoreHydration from '@/components/StoreHydration'

export const metadata: Metadata = {
  title: 'Run-On',
  description: 'Team management for coaches',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Run-On' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <StoreHydration />
        <ServiceWorker />
        {children}
      </body>
    </html>
  )
}
