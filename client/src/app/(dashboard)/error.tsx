'use client'
import { useEffect } from 'react'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[dashboard]', error)
  }, [error])

  return (
    <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <h2 className="mb-2 text-xl font-bold text-red-900">Bir şeyler ters gitti</h2>
      <p className="mb-4 text-sm text-red-700">{error.message || 'Beklenmeyen bir hata oluştu.'}</p>
      <div className="flex justify-center gap-3">
        <button onClick={reset} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          Tekrar dene
        </button>
        <a href="/dashboard" className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
          Pano'ya dön
        </a>
      </div>
      {error.digest && <p className="mt-4 font-mono text-xs text-red-500">ref: {error.digest}</p>}
    </div>
  )
}
