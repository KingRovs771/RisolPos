import type { Metadata, Viewport } from 'next'
import { ToastProvider } from '@/components/shared/Toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'RisolPOS — Kasir Gerobak Risol UMKM',
  description: 'Aplikasi kasir (POS) dan pengawasan stok berbasis Mobile PWA untuk UMKM gerobak risol pinggir jalan.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/icon.svg'],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RisolPOS',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F59E0B',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className="bg-slate-100 text-slate-900 antialiased min-h-screen">
        <ToastProvider>{children}</ToastProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
