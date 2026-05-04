import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { StoreProvider } from '@/components/providers/StoreProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { AuthSessionProvider } from '@/components/providers/AuthSessionProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://pettoptan.com.tr'),
  title: {
    default: "PetToptan — Türkiye'nin Toptan Pet Mağazası",
    template: '%s | PetToptan',
  },
  description: 'Türkiye genelinde evcil hayvan ürünleri toptan satış. Kedi, köpek, kuş mamaları ve aksesuarları. B2B toptan fiyatlar.',
  keywords: ['pet toptan', 'evcil hayvan toptan', 'kedi maması toptan', 'köpek maması toptan', 'pet shop toptan'],
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'PetToptan',
    images: [{ url: '/og-default.jpg' }],
  },
  twitter: { card: 'summary_large_image' },
  // Browser'ın kendi force-dark mekanizmalarını engellemek için her iki şemayı da
  // desteklediğimizi söylüyoruz; prefers-color-scheme'e göre next-themes karar verir.
  colorScheme: 'light dark',
}

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PetToptan',
  url: 'https://pettoptan.com.tr',
  logo: 'https://pettoptan.com.tr/logo.svg',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: 'Turkish',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body>
        <AuthSessionProvider>
          <StoreProvider>
            <QueryProvider>
              <ThemeProvider>
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3500,
                    style: { background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' },
                  }}
                />
              </ThemeProvider>
            </QueryProvider>
          </StoreProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
