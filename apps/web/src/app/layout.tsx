import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { OfflineBanner } from '@/components/mobile/OfflineBanner'

export const metadata: Metadata = {
  title:       { default: 'TimeFlow', template: '%s | TimeFlow' },
  description: 'Your intelligent daily schedule tracker — live task tracking, streaks and academic periods',
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:       true,
    statusBarStyle: 'default',
    title:         'TimeFlow',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type:        'website',
    siteName:    'TimeFlow',
    title:       'TimeFlow — Live Schedule Tracker',
    description: 'Track your day in real time. Intervals, streaks, academic periods.',
  },
  icons: {
    icon:             '/icon-192.png',
    shortcut:         '/icon-192.png',
    apple:            '/icon-192.png',
    other: [{ rel: 'apple-touch-icon-precomposed', url: '/icon-192.png' }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7F77DD' },
    { media: '(prefers-color-scheme: dark)',  color: '#26215C' },
  ],
  width:             'device-width',
  initialScale:      1,
  maximumScale:      1,        // Prevent accidental zoom in PWA
  userScalable:      false,
  viewportFit:       'cover',  // Safe area for notched phones
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* iOS PWA meta */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TimeFlow" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body className="font-sans overscroll-none">
        <ServiceWorkerRegistration />
        <OfflineBanner />
        {children}
        <InstallPrompt />
      </body>
    </html>
  )
}
