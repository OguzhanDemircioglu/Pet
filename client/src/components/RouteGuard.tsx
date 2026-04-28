import { useLocation, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { findBucket } from '../utils/matchRoute'

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const user = useSelector((s: RootState) => s.auth.user)
  const authInitialized = useSelector((s: RootState) => s.auth.initialized)
  const routes = useSelector((s: RootState) => s.routes.data)

  if (!authInitialized) return null

  if (location.hash) {
    return <Navigate to={location.pathname + location.search} replace />
  }

  const bucket = findBucket(location.pathname, routes)

  if (bucket === null) {
    return <Navigate to="/" replace />
  }

  if (bucket === 'admin') {
    if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  }

  if (bucket === 'customer') {
    const isGuest = localStorage.getItem('pt-guest') === 'true'
    if (!user && !isGuest) return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
